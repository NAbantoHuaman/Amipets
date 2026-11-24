import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SERVICE_PRICES,
  Priority,
  RequestStatus,
  ServicePrices,
  ServiceType,
  Species,
  UserAppSettings,
  VeterinaryRequest,
} from '../../domain/models/request';
import { sqliteRequestRepository } from '../repositories/SqliteRequestRepository';
import { sqliteSettingsRepository } from '../repositories/SqliteSettingsRepository';
import { firestoreDb } from './firebaseConfig';

export interface SyncRequestsSummary {
  pushed: number;
  deleted: number;
  pulled: number;
  settingsSynced: boolean;
  failed: number;
}

export function buildFirestoreRequestPayload(req: VeterinaryRequest, syncedAt: string) {
  return {
    id: req.id.slice(0, 80),
    userId: req.userId ?? '',
    clienteNombre: req.clienteNombre.trim().slice(0, 80),
    telefono: (req.telefono.trim() || '999999999').slice(0, 30),
    mascotaNombre: req.mascotaNombre.trim().slice(0, 60),
    especie: req.especie ?? null,
    raza: req.raza ? req.raza.trim().slice(0, 80) : null,
    tipoServicio: req.tipoServicio,
    prioridad: req.prioridad,
    descripcion: (req.descripcion ?? '').slice(0, 400),
    estado: req.estado,
    fechaRegistro: req.fechaRegistro,
    registradoPor: req.registradoPor ? req.registradoPor.slice(0, 100) : null,
    registradoPorUsuario: req.registradoPorUsuario ? req.registradoPorUsuario.slice(0, 100) : null,
    updatedAt: req.updatedAt ?? syncedAt,
    syncedAt,
  };
}

function mapDocToRequest(docId: string, data: Record<string, any>, fallbackUid: string): VeterinaryRequest {
  return {
    id: typeof data.id === 'string' && data.id ? data.id : docId,
    userId: data.userId ?? fallbackUid,
    clienteNombre: String(data.clienteNombre ?? ''),
    telefono: String(data.telefono ?? ''),
    mascotaNombre: String(data.mascotaNombre ?? ''),
    especie: (data.especie as Species | null) ?? undefined,
    raza: data.raza ?? undefined,
    tipoServicio: (data.tipoServicio as ServiceType) ?? 'CONSULTA',
    prioridad: (data.prioridad as Priority) ?? 'MEDIA',
    descripcion: String(data.descripcion ?? ''),
    estado: (data.estado as RequestStatus) ?? 'PENDIENTE',
    fechaRegistro: String(data.fechaRegistro ?? new Date().toISOString()),
    registradoPor: data.registradoPor ?? undefined,
    registradoPorUsuario: data.registradoPorUsuario ?? undefined,
    updatedAt: data.updatedAt ?? undefined,
    syncedAt: data.syncedAt ?? undefined,
    syncStatus: 'SYNCED',
  };
}

export async function pushRequestToFirestore(req: VeterinaryRequest, syncedAt: string): Promise<void> {
  if (!req.userId) {
    throw new Error('Solicitud sin usuario asignado.');
  }
  const payload = buildFirestoreRequestPayload(req, syncedAt);
  await setDoc(doc(firestoreDb, 'requests', req.id), payload, { merge: true });
}

export async function deleteRequestFromFirestore(requestId: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, 'requests', requestId));
}

export async function fetchUserRequestsFromFirestore(fallbackUid: string): Promise<VeterinaryRequest[]> {
  const snapshot = await getDocs(collection(firestoreDb, 'requests'));
  return snapshot.docs.map((docSnap) =>
    mapDocToRequest(docSnap.id, docSnap.data() as Record<string, any>, fallbackUid),
  );
}

const clampPrice = (v: number, def: number) =>
  Number.isFinite(v) && v >= 0 && v <= 50000 ? Number(v) : def;

export async function pushClinicPricesToFirestore(
  prices: ServicePrices,
  updatedBy?: string,
): Promise<void> {
  const now = new Date().toISOString();
  await setDoc(
    doc(firestoreDb, 'clinic_settings', 'main'),
    {
      servicePrices: {
        CONSULTA: clampPrice(prices.CONSULTA, DEFAULT_SERVICE_PRICES.CONSULTA),
        VACUNACION: clampPrice(prices.VACUNACION, DEFAULT_SERVICE_PRICES.VACUNACION),
        EMERGENCIA: clampPrice(prices.EMERGENCIA, DEFAULT_SERVICE_PRICES.EMERGENCIA),
        GROOMING: clampPrice(prices.GROOMING, DEFAULT_SERVICE_PRICES.GROOMING),
      },
      updatedAt: now,
      updatedBy: updatedBy ? updatedBy.slice(0, 100) : null,
    },
    { merge: true },
  );
}

export async function fetchClinicPricesFromFirestore(): Promise<ServicePrices | null> {
  const snap = await getDoc(doc(firestoreDb, 'clinic_settings', 'main'));
  if (!snap.exists()) return null;
  const sp = ((snap.data() as Record<string, any>).servicePrices ?? {}) as Record<string, any>;
  return {
    CONSULTA: typeof sp.CONSULTA === 'number' ? sp.CONSULTA : DEFAULT_SERVICE_PRICES.CONSULTA,
    VACUNACION:
      typeof sp.VACUNACION === 'number' ? sp.VACUNACION : DEFAULT_SERVICE_PRICES.VACUNACION,
    EMERGENCIA:
      typeof sp.EMERGENCIA === 'number' ? sp.EMERGENCIA : DEFAULT_SERVICE_PRICES.EMERGENCIA,
    GROOMING: typeof sp.GROOMING === 'number' ? sp.GROOMING : DEFAULT_SERVICE_PRICES.GROOMING,
  };
}

export function subscribeClinicPricesSnapshot(
  onPrices: (prices: ServicePrices) => void,
): Unsubscribe {
  return onSnapshot(
    doc(firestoreDb, 'clinic_settings', 'main'),
    (docSnap) => {
      if (!docSnap.exists() || docSnap.metadata.hasPendingWrites) return;
      const sp = ((docSnap.data() as Record<string, any>).servicePrices ?? {}) as Record<
        string,
        any
      >;
      onPrices({
        CONSULTA: typeof sp.CONSULTA === 'number' ? sp.CONSULTA : DEFAULT_SERVICE_PRICES.CONSULTA,
        VACUNACION:
          typeof sp.VACUNACION === 'number' ? sp.VACUNACION : DEFAULT_SERVICE_PRICES.VACUNACION,
        EMERGENCIA:
          typeof sp.EMERGENCIA === 'number' ? sp.EMERGENCIA : DEFAULT_SERVICE_PRICES.EMERGENCIA,
        GROOMING: typeof sp.GROOMING === 'number' ? sp.GROOMING : DEFAULT_SERVICE_PRICES.GROOMING,
      });
    },
    () => {
      // Ignore transient offline listener errors
    },
  );
}

export async function pushUserSettingsToFirestore(
  settings: UserAppSettings,
  syncedAt: string,
): Promise<void> {
  const payload = {
    userId: settings.userId,
    servicePrices: {
      CONSULTA: clampPrice(settings.servicePrices.CONSULTA, DEFAULT_SERVICE_PRICES.CONSULTA),
      VACUNACION: clampPrice(settings.servicePrices.VACUNACION, DEFAULT_SERVICE_PRICES.VACUNACION),
      EMERGENCIA: clampPrice(settings.servicePrices.EMERGENCIA, DEFAULT_SERVICE_PRICES.EMERGENCIA),
      GROOMING: clampPrice(settings.servicePrices.GROOMING, DEFAULT_SERVICE_PRICES.GROOMING),
    },
    prefs: {
      notifyUrgent: Boolean(settings.prefs.notifyUrgent),
      soundAlerts: Boolean(settings.prefs.soundAlerts),
      vaccineReminders: Boolean(settings.prefs.vaccineReminders),
    },
    readIds: settings.readIds
      .filter((x) => typeof x === 'string' && x.length > 0 && x.length <= 120)
      .slice(-250),
    updatedAt: settings.updatedAt || syncedAt,
    syncedAt,
  };

  await setDoc(doc(firestoreDb, 'user_settings', settings.userId), payload, { merge: true });
}

function mapDocToUserSettings(userId: string, data: Record<string, any>): UserAppSettings {
  const sp = (data.servicePrices ?? {}) as Record<string, any>;
  const pf = (data.prefs ?? {}) as Record<string, any>;
  return {
    userId,
    servicePrices: {
      CONSULTA: typeof sp.CONSULTA === 'number' ? sp.CONSULTA : DEFAULT_SERVICE_PRICES.CONSULTA,
      VACUNACION:
        typeof sp.VACUNACION === 'number' ? sp.VACUNACION : DEFAULT_SERVICE_PRICES.VACUNACION,
      EMERGENCIA:
        typeof sp.EMERGENCIA === 'number' ? sp.EMERGENCIA : DEFAULT_SERVICE_PRICES.EMERGENCIA,
      GROOMING: typeof sp.GROOMING === 'number' ? sp.GROOMING : DEFAULT_SERVICE_PRICES.GROOMING,
    },
    prefs: {
      notifyUrgent:
        typeof pf.notifyUrgent === 'boolean'
          ? pf.notifyUrgent
          : DEFAULT_NOTIFICATION_PREFS.notifyUrgent,
      soundAlerts:
        typeof pf.soundAlerts === 'boolean' ? pf.soundAlerts : DEFAULT_NOTIFICATION_PREFS.soundAlerts,
      vaccineReminders:
        typeof pf.vaccineReminders === 'boolean'
          ? pf.vaccineReminders
          : DEFAULT_NOTIFICATION_PREFS.vaccineReminders,
    },
    readIds: Array.isArray(data.readIds)
      ? data.readIds.filter((x: unknown): x is string => typeof x === 'string')
      : [],
    syncStatus: 'SYNCED',
    syncedAt: typeof data.syncedAt === 'string' ? data.syncedAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
}

export async function fetchUserSettingsFromFirestore(
  userId: string,
): Promise<UserAppSettings | null> {
  const snap = await getDoc(doc(firestoreDb, 'user_settings', userId));
  if (!snap.exists()) return null;
  return mapDocToUserSettings(userId, snap.data() as Record<string, any>);
}

export async function syncUserRequestsAndSettings(
  userId: string,
  isAdmin = false,
  updatedByLabel?: string,
): Promise<SyncRequestsSummary> {
  const summary: SyncRequestsSummary = {
    pushed: 0,
    deleted: 0,
    pulled: 0,
    settingsSynced: false,
    failed: 0,
  };

  const pendingRequests = await sqliteRequestRepository.getPendingSync();
  for (const req of pendingRequests) {
    try {
      if (req.deletedAt) {
        await deleteRequestFromFirestore(req.id);
        await sqliteRequestRepository.hardDelete(req.id);
        summary.deleted += 1;
        continue;
      }

      const syncedAt = new Date().toISOString();
      await pushRequestToFirestore({ ...req, userId: req.userId || userId }, syncedAt);
      await sqliteRequestRepository.markSynced(req.id, syncedAt);
      summary.pushed += 1;
    } catch {
      summary.failed += 1;
    }
  }

  try {
    const remoteRequests = await fetchUserRequestsFromFirestore(userId);
    await sqliteRequestRepository.reconcileRemoteSnapshot(userId, remoteRequests);
    summary.pulled = remoteRequests.length;
  } catch {
    summary.failed += 1;
  }

  try {
    const localSettings = await sqliteSettingsRepository.getByUserId(userId);
    if (localSettings && localSettings.syncStatus === 'PENDING') {
      const syncedAt = new Date().toISOString();
      await pushUserSettingsToFirestore(localSettings, syncedAt);
      if (isAdmin) {
        await pushClinicPricesToFirestore(localSettings.servicePrices, updatedByLabel);
      }
      await sqliteSettingsRepository.markSynced(userId, syncedAt);
      summary.settingsSynced = true;
    } else {
      const [remoteSettings, clinicPrices] = await Promise.all([
        fetchUserSettingsFromFirestore(userId),
        fetchClinicPricesFromFirestore().catch(() => null),
      ]);
      const base = remoteSettings ?? (await sqliteSettingsRepository.getOrCreate(userId));
      await sqliteSettingsRepository.upsertFromRemote({
        ...base,
        servicePrices: clinicPrices ?? base.servicePrices,
      });
      summary.settingsSynced = true;
    }
  } catch {
    // Settings sync is best-effort alongside requests
  }

  return summary;
}

export function subscribeUserRequestsSnapshot(
  fallbackUid: string,
  onRemoteUpdate: (requests: VeterinaryRequest[]) => void,
): Unsubscribe {
  return onSnapshot(
    collection(firestoreDb, 'requests'),
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      const items = snapshot.docs.map((docSnap) =>
        mapDocToRequest(docSnap.id, docSnap.data() as Record<string, any>, fallbackUid),
      );
      onRemoteUpdate(items);
    },
    () => {
      // Ignore transient offline listener errors
    },
  );
}

export function subscribeUserSettingsSnapshot(
  userId: string,
  onRemoteSettings: (settings: UserAppSettings) => void,
): Unsubscribe {
  return onSnapshot(
    doc(firestoreDb, 'user_settings', userId),
    (docSnap) => {
      if (!docSnap.exists() || docSnap.metadata.hasPendingWrites) return;
      onRemoteSettings(mapDocToUserSettings(userId, docSnap.data() as Record<string, any>));
    },
    () => {
      // Ignore transient offline listener errors
    },
  );
}
