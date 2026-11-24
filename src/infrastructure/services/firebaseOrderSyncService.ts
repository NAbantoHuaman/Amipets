import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { OrderCategory, OrderStatus, PetOrder } from '../../domain/models/order';
import { Species } from '../../domain/models/request';
import { sqliteOrderRepository } from '../repositories/SqliteOrderRepository';
import { firebaseStorage, firestoreDb } from './firebaseConfig';

export interface SyncOrdersSummary {
  pushed: number;
  deleted: number;
  pulled: number;
  failed: number;
  storageWarning: boolean;
}

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadOrderReceipt(
  userId: string,
  orderId: string,
  localUri: string,
): Promise<{ url: string | null; unavailable?: boolean }> {
  try {
    const blob = await uriToBlob(localUri);
    try {
      const storageRef = ref(firebaseStorage, `receipts/${userId}/${orderId}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadUrl = await getDownloadURL(storageRef);
      return { url: downloadUrl };
    } finally {
      (blob as any)?.close?.();
    }
  } catch {
    return { url: null, unavailable: true };
  }
}

export function buildFirestoreOrderPayload(order: PetOrder, syncedAt: string) {
  return {
    id: order.id,
    userId: order.userId ?? '',
    clienteNombre: order.clienteNombre,
    telefono: order.telefono ?? null,
    mascotaNombre: order.mascotaNombre ?? null,
    especie: order.especie ?? null,
    productoId:
      typeof order.productoId === 'number' && order.productoId >= 1
        ? Math.round(order.productoId)
        : null,
    marca: order.marca ?? null,
    sku: order.sku ?? null,
    categoria: order.categoria,
    producto: order.producto,
    cantidad: Math.max(1, Math.min(999, Math.round(Number(order.cantidad) || 1))),
    precio: Number(order.precio),
    notas: order.notas ?? null,
    estado: order.estado,
    fechaRegistro: order.fechaRegistro,
    registradoPor: order.registradoPor ?? null,
    registradoPorUsuario: order.registradoPorUsuario ?? null,
    comprobanteUrl: order.comprobanteUrl ?? null,
    updatedAt: order.updatedAt ?? syncedAt,
    syncedAt,
  };
}

export async function pushOrderToFirestore(order: PetOrder, syncedAt: string): Promise<void> {
  if (!order.userId) {
    throw new Error('Pedido sin usuario asignado.');
  }
  const payload = buildFirestoreOrderPayload(order, syncedAt);
  await setDoc(doc(firestoreDb, 'orders', order.id), payload, { merge: true });
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, 'orders', orderId));
}

export async function fetchUserOrdersFromFirestore(fallbackUid: string): Promise<PetOrder[]> {
  const snapshot = await getDocs(collection(firestoreDb, 'orders'));

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, any>;
    return {
      id: typeof data.id === 'string' && data.id ? data.id : docSnap.id,
      userId: data.userId ?? fallbackUid,
      clienteNombre: String(data.clienteNombre ?? ''),
      telefono: data.telefono ?? undefined,
      mascotaNombre: data.mascotaNombre ?? undefined,
      especie: (data.especie as Species | null) ?? undefined,
      productoId:
        typeof data.productoId === 'number' ? Number(data.productoId) : undefined,
      marca: data.marca ?? undefined,
      sku: data.sku ?? undefined,
      categoria: (data.categoria as OrderCategory) ?? 'ACCESORIOS',
      producto: String(data.producto ?? ''),
      cantidad: Number(data.cantidad ?? 1),
      precio: Number(data.precio ?? 0),
      notas: data.notas ?? undefined,
      estado: (data.estado as OrderStatus) ?? 'PENDIENTE',
      fechaRegistro: String(data.fechaRegistro ?? new Date().toISOString()),
      registradoPor: data.registradoPor ?? undefined,
      registradoPorUsuario: data.registradoPorUsuario ?? undefined,
      comprobanteUrl: data.comprobanteUrl ?? undefined,
      updatedAt: data.updatedAt ?? undefined,
      syncedAt: data.syncedAt ?? undefined,
      syncStatus: 'SYNCED',
    };
  });
}

export async function syncUserOrders(userId: string): Promise<SyncOrdersSummary> {
  const summary: SyncOrdersSummary = {
    pushed: 0,
    deleted: 0,
    pulled: 0,
    failed: 0,
    storageWarning: false,
  };

  const pending = await sqliteOrderRepository.getPendingSync(userId);

  for (const order of pending) {
    try {
      if (order.deletedAt) {
        await deleteOrderFromFirestore(order.id);
        await sqliteOrderRepository.hardDelete(order.id);
        summary.deleted += 1;
        continue;
      }

      let nextUrl = order.comprobanteUrl;
      if (order.comprobanteLocalUri && !nextUrl) {
        const uploadRes = await uploadOrderReceipt(
          userId,
          order.id,
          order.comprobanteLocalUri,
        );
        if (uploadRes.url) {
          nextUrl = uploadRes.url;
        } else if (uploadRes.unavailable) {
          summary.storageWarning = true;
        }
      }

      const syncedAt = new Date().toISOString();
      await pushOrderToFirestore(
        { ...order, userId: order.userId || userId, comprobanteUrl: nextUrl },
        syncedAt,
      );
      await sqliteOrderRepository.markSynced(order.id, syncedAt, nextUrl);
      summary.pushed += 1;
    } catch {
      summary.failed += 1;
    }
  }

  try {
    const remoteOrders = await fetchUserOrdersFromFirestore(userId);
    await sqliteOrderRepository.reconcileRemoteSnapshot(userId, remoteOrders);
    summary.pulled = remoteOrders.length;
  } catch {
    summary.failed += 1;
  }

  return summary;
}

export function subscribeUserOrdersSnapshot(
  fallbackUid: string,
  onRemoteOrders: (orders: PetOrder[]) => void,
): Unsubscribe {
  return onSnapshot(
    collection(firestoreDb, 'orders'),
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        return {
          id: typeof data.id === 'string' && data.id ? data.id : docSnap.id,
          userId: data.userId ?? fallbackUid,
          clienteNombre: String(data.clienteNombre ?? ''),
          telefono: data.telefono ?? undefined,
          mascotaNombre: data.mascotaNombre ?? undefined,
          especie: (data.especie as Species | null) ?? undefined,
          productoId: typeof data.productoId === 'number' ? Number(data.productoId) : undefined,
          marca: data.marca ?? undefined,
          sku: data.sku ?? undefined,
          categoria: (data.categoria as OrderCategory) ?? 'ACCESORIOS',
          producto: String(data.producto ?? ''),
          cantidad: Number(data.cantidad ?? 1),
          precio: Number(data.precio ?? 0),
          notas: data.notas ?? undefined,
          estado: (data.estado as OrderStatus) ?? 'PENDIENTE',
          fechaRegistro: String(data.fechaRegistro ?? new Date().toISOString()),
          registradoPor: data.registradoPor ?? undefined,
          registradoPorUsuario: data.registradoPorUsuario ?? undefined,
          comprobanteUrl: data.comprobanteUrl ?? undefined,
          updatedAt: data.updatedAt ?? undefined,
          syncedAt: data.syncedAt ?? undefined,
          syncStatus: 'SYNCED' as const,
        };
      });
      onRemoteOrders(items);
    },
    () => {
      // Ignore transient offline listener errors
    },
  );
}

export const firebaseOrderSyncService = {
  uploadOrderReceipt,
  pushOrderToFirestore,
  deleteOrderFromFirestore,
  fetchUserOrdersFromFirestore,
  syncUserOrders,
  subscribeUserOrdersSnapshot,
};
