import {
  OrderCategory,
  OrderChanges,
  OrderInput,
  OrderStatus,
  PetOrder,
  SyncStatus,
} from '../../domain/models/order';
import { Species } from '../../domain/models/request';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { getOrdersDb, readFallbackOrders, writeFallbackOrders } from '../database/sqlite';

interface OrderRow {
  id: string;
  userId: string | null;
  clienteNombre: string;
  telefono: string | null;
  mascotaNombre: string | null;
  especie: string | null;
  productoId: number | null;
  marca: string | null;
  sku: string | null;
  categoria: string;
  producto: string;
  cantidad: number;
  precio: number;
  notas: string | null;
  estado: string;
  fechaRegistro: string;
  registradoPor: string | null;
  registradoPorUsuario: string | null;
  syncStatus: string | null;
  syncedAt: string | null;
  updatedAt: string | null;
  comprobanteLocalUri: string | null;
  comprobanteUrl: string | null;
  deletedAt: string | null;
}

function generateOrderId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `ord_${time}${random}`;
}

function mapRowToOrder(row: OrderRow): PetOrder {
  const syncStatus: SyncStatus = row.syncStatus === 'SYNCED' ? 'SYNCED' : 'PENDING';
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    clienteNombre: row.clienteNombre,
    telefono: row.telefono ?? undefined,
    mascotaNombre: row.mascotaNombre ?? undefined,
    especie: (row.especie as Species | null) ?? undefined,
    productoId:
      row.productoId !== null && row.productoId !== undefined
        ? Number(row.productoId)
        : undefined,
    marca: row.marca ?? undefined,
    sku: row.sku ?? undefined,
    categoria: row.categoria as OrderCategory,
    producto: row.producto,
    cantidad: Number(row.cantidad),
    precio: Number(row.precio),
    notas: row.notas ?? undefined,
    estado: row.estado as OrderStatus,
    fechaRegistro: row.fechaRegistro,
    registradoPor: row.registradoPor ?? undefined,
    registradoPorUsuario: row.registradoPorUsuario ?? undefined,
    syncStatus,
    syncedAt: row.syncedAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
    comprobanteLocalUri: row.comprobanteLocalUri ?? undefined,
    comprobanteUrl: row.comprobanteUrl ?? undefined,
    deletedAt: row.deletedAt ?? undefined,
  };
}

export class SqliteOrderRepository implements IOrderRepository {
  private memoryFallback: PetOrder[] = [];

  private loadFallback(): PetOrder[] {
    const stored = readFallbackOrders<PetOrder>();
    if (stored.length > 0) {
      this.memoryFallback = stored;
    }
    return [...this.memoryFallback];
  }

  private saveFallback(list: PetOrder[]): void {
    this.memoryFallback = [...list];
    writeFallbackOrders(this.memoryFallback);
  }

  async getAll(userId?: string): Promise<PetOrder[]> {
    const db = await getOrdersDb();
    if (!db) {
      return this.loadFallback()
        .filter((o) => !o.deletedAt && (!userId || o.userId === userId))
        .sort(
          (a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime(),
        );
    }

    const rows = userId
      ? await db.getAllAsync<OrderRow>(
          'SELECT * FROM orders WHERE deletedAt IS NULL AND userId = ? ORDER BY fechaRegistro DESC',
          [userId],
        )
      : await db.getAllAsync<OrderRow>(
          'SELECT * FROM orders WHERE deletedAt IS NULL ORDER BY fechaRegistro DESC',
        );
    return rows.map(mapRowToOrder);
  }

  async getPendingSync(userId: string): Promise<PetOrder[]> {
    const db = await getOrdersDb();
    if (!db) {
      return this.loadFallback().filter(
        (o) => o.userId === userId && (!o.syncStatus || o.syncStatus === 'PENDING'),
      );
    }

    const rows = await db.getAllAsync<OrderRow>(
      "SELECT * FROM orders WHERE userId = ? AND (syncStatus IS NULL OR syncStatus = 'PENDING') ORDER BY fechaRegistro ASC",
      [userId],
    );
    return rows.map(mapRowToOrder);
  }

  async getById(id: string): Promise<PetOrder | undefined> {
    const db = await getOrdersDb();
    if (!db) {
      return this.loadFallback().find((o) => o.id === id);
    }

    const row = await db.getFirstAsync<OrderRow>('SELECT * FROM orders WHERE id = ?', [id]);
    return row ? mapRowToOrder(row) : undefined;
  }

  async create(input: OrderInput): Promise<PetOrder> {
    const now = new Date().toISOString();
    const newOrder: PetOrder = {
      id: generateOrderId(),
      userId: input.userId,
      clienteNombre: input.clienteNombre.trim(),
      telefono: input.telefono?.trim() || undefined,
      mascotaNombre: input.mascotaNombre?.trim() || undefined,
      especie: input.especie,
      productoId: input.productoId,
      marca: input.marca?.trim() || undefined,
      sku: input.sku?.trim() || undefined,
      categoria: input.categoria,
      producto: input.producto.trim(),
      cantidad: Number(input.cantidad),
      precio: Number(input.precio),
      notas: input.notas?.trim() || undefined,
      estado: input.estado ?? 'PENDIENTE',
      fechaRegistro: input.fechaRegistro ?? now,
      registradoPor: input.registradoPor?.trim() || undefined,
      registradoPorUsuario: input.registradoPorUsuario?.trim() || undefined,
      syncStatus: 'PENDING',
      updatedAt: now,
      comprobanteLocalUri: input.comprobanteLocalUri,
      comprobanteUrl: input.comprobanteUrl,
    };

    const db = await getOrdersDb();
    if (!db) {
      const current = this.loadFallback();
      const updated = [newOrder, ...current];
      this.saveFallback(updated);
      return newOrder;
    }

    await db.runAsync(
      `INSERT INTO orders (
        id, userId, clienteNombre, telefono, mascotaNombre, especie,
        productoId, marca, sku, categoria, producto, cantidad, precio,
        notas, estado, fechaRegistro, registradoPor, registradoPorUsuario,
        syncStatus, syncedAt, updatedAt, comprobanteLocalUri, comprobanteUrl, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrder.id,
        newOrder.userId ?? null,
        newOrder.clienteNombre,
        newOrder.telefono ?? null,
        newOrder.mascotaNombre ?? null,
        newOrder.especie ?? null,
        newOrder.productoId ?? null,
        newOrder.marca ?? null,
        newOrder.sku ?? null,
        newOrder.categoria,
        newOrder.producto,
        newOrder.cantidad,
        newOrder.precio,
        newOrder.notas ?? null,
        newOrder.estado,
        newOrder.fechaRegistro,
        newOrder.registradoPor ?? null,
        newOrder.registradoPorUsuario ?? null,
        newOrder.syncStatus ?? 'PENDING',
        newOrder.syncedAt ?? null,
        newOrder.updatedAt ?? now,
        newOrder.comprobanteLocalUri ?? null,
        newOrder.comprobanteUrl ?? null,
        null,
      ],
    );

    return newOrder;
  }

  async update(id: string, changes: OrderChanges): Promise<PetOrder> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Pedido con ID ${id} no encontrado.`);
    }

    const now = new Date().toISOString();
    const updated: PetOrder = {
      ...existing,
      ...changes,
      id: existing.id,
      userId: existing.userId ?? changes.userId,
      clienteNombre: (changes.clienteNombre ?? existing.clienteNombre).trim(),
      telefono:
        changes.telefono !== undefined
          ? changes.telefono.trim() || undefined
          : existing.telefono,
      mascotaNombre:
        changes.mascotaNombre !== undefined
          ? changes.mascotaNombre.trim() || undefined
          : existing.mascotaNombre,
      especie: 'especie' in changes ? changes.especie : existing.especie,
      productoId: 'productoId' in changes ? changes.productoId : existing.productoId,
      marca:
        changes.marca !== undefined ? changes.marca.trim() || undefined : existing.marca,
      sku: changes.sku !== undefined ? changes.sku.trim() || undefined : existing.sku,
      producto: (changes.producto ?? existing.producto).trim(),
      cantidad: changes.cantidad !== undefined ? Number(changes.cantidad) : existing.cantidad,
      precio: changes.precio !== undefined ? Number(changes.precio) : existing.precio,
      notas:
        changes.notas !== undefined ? changes.notas.trim() || undefined : existing.notas,
      fechaRegistro: changes.fechaRegistro ?? existing.fechaRegistro,
      registradoPor:
        changes.registradoPor !== undefined
          ? changes.registradoPor.trim() || undefined
          : existing.registradoPor,
      registradoPorUsuario:
        changes.registradoPorUsuario !== undefined
          ? changes.registradoPorUsuario.trim() || undefined
          : existing.registradoPorUsuario,
      comprobanteLocalUri:
        'comprobanteLocalUri' in changes
          ? changes.comprobanteLocalUri
          : existing.comprobanteLocalUri,
      comprobanteUrl:
        'comprobanteUrl' in changes ? changes.comprobanteUrl : existing.comprobanteUrl,
      updatedAt: now,
      syncStatus: changes.syncStatus ?? 'PENDING',
    };

    const db = await getOrdersDb();
    if (!db) {
      const list = this.loadFallback().map((o) => (o.id === id ? updated : o));
      this.saveFallback(list);
      return updated;
    }

    await db.runAsync(
      `UPDATE orders SET
        userId = ?,
        clienteNombre = ?,
        telefono = ?,
        mascotaNombre = ?,
        especie = ?,
        productoId = ?,
        marca = ?,
        sku = ?,
        categoria = ?,
        producto = ?,
        cantidad = ?,
        precio = ?,
        notas = ?,
        estado = ?,
        fechaRegistro = ?,
        registradoPor = ?,
        registradoPorUsuario = ?,
        syncStatus = ?,
        syncedAt = ?,
        updatedAt = ?,
        comprobanteLocalUri = ?,
        comprobanteUrl = ?,
        deletedAt = ?
      WHERE id = ?`,
      [
        updated.userId ?? null,
        updated.clienteNombre,
        updated.telefono ?? null,
        updated.mascotaNombre ?? null,
        updated.especie ?? null,
        updated.productoId ?? null,
        updated.marca ?? null,
        updated.sku ?? null,
        updated.categoria,
        updated.producto,
        updated.cantidad,
        updated.precio,
        updated.notas ?? null,
        updated.estado,
        updated.fechaRegistro,
        updated.registradoPor ?? null,
        updated.registradoPorUsuario ?? null,
        updated.syncStatus ?? 'PENDING',
        updated.syncedAt ?? null,
        updated.updatedAt ?? now,
        updated.comprobanteLocalUri ?? null,
        updated.comprobanteUrl ?? null,
        updated.deletedAt ?? null,
        updated.id,
      ],
    );

    return updated;
  }

  async changeStatus(id: string, status: OrderStatus): Promise<PetOrder> {
    return this.update(id, { estado: status });
  }

  async markSynced(id: string, syncedAt: string, comprobanteUrl?: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;

    const nextUrl = comprobanteUrl ?? existing.comprobanteUrl;
    const db = await getOrdersDb();
    if (!db) {
      const list = this.loadFallback().map((o) =>
        o.id === id
          ? {
              ...o,
              syncStatus: 'SYNCED' as SyncStatus,
              syncedAt,
              comprobanteUrl: nextUrl,
            }
          : o,
      );
      this.saveFallback(list);
      return;
    }

    await db.runAsync(
      `UPDATE orders SET syncStatus = 'SYNCED', syncedAt = ?, comprobanteUrl = ? WHERE id = ?`,
      [syncedAt, nextUrl ?? null, id],
    );
  }

  async upsertFromRemote(order: PetOrder): Promise<void> {
    const existing = await this.getById(order.id);
    if (existing && (existing.syncStatus === 'PENDING' || existing.deletedAt)) {
      return;
    }

    const merged: PetOrder = {
      ...order,
      syncStatus: 'SYNCED',
      comprobanteLocalUri: existing?.comprobanteLocalUri ?? order.comprobanteLocalUri,
      deletedAt: undefined,
    };

    const db = await getOrdersDb();
    if (!db) {
      const current = this.loadFallback();
      const exists = current.some((o) => o.id === merged.id);
      const next = exists
        ? current.map((o) => (o.id === merged.id ? merged : o))
        : [merged, ...current];
      this.saveFallback(next);
      return;
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO orders (
        id, userId, clienteNombre, telefono, mascotaNombre, especie,
        productoId, marca, sku, categoria, producto, cantidad, precio,
        notas, estado, fechaRegistro, registradoPor, registradoPorUsuario,
        syncStatus, syncedAt, updatedAt, comprobanteLocalUri, comprobanteUrl, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merged.id,
        merged.userId ?? null,
        merged.clienteNombre,
        merged.telefono ?? null,
        merged.mascotaNombre ?? null,
        merged.especie ?? null,
        merged.productoId ?? null,
        merged.marca ?? null,
        merged.sku ?? null,
        merged.categoria,
        merged.producto,
        merged.cantidad,
        merged.precio,
        merged.notas ?? null,
        merged.estado,
        merged.fechaRegistro,
        merged.registradoPor ?? null,
        merged.registradoPorUsuario ?? null,
        'SYNCED',
        merged.syncedAt ?? merged.updatedAt ?? new Date().toISOString(),
        merged.updatedAt ?? merged.fechaRegistro,
        merged.comprobanteLocalUri ?? null,
        merged.comprobanteUrl ?? null,
        null,
      ],
    );
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    if (existing.syncStatus === 'SYNCED' && existing.userId) {
      const now = new Date().toISOString();
      const db = await getOrdersDb();
      if (!db) {
        const list = this.loadFallback().map((o) =>
          o.id === id
            ? {
                ...o,
                deletedAt: now,
                updatedAt: now,
                syncStatus: 'PENDING' as SyncStatus,
              }
            : o,
        );
        this.saveFallback(list);
        return true;
      }

      const result = await db.runAsync(
        `UPDATE orders SET deletedAt = ?, updatedAt = ?, syncStatus = 'PENDING' WHERE id = ?`,
        [now, now, id],
      );
      return result.changes > 0;
    }

    return this.hardDelete(id);
  }

  async hardDelete(id: string): Promise<boolean> {
    const db = await getOrdersDb();
    if (!db) {
      const current = this.loadFallback();
      const filtered = current.filter((o) => o.id !== id);
      this.saveFallback(filtered);
      return filtered.length < current.length;
    }

    const result = await db.runAsync('DELETE FROM orders WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async clearAll(userId?: string): Promise<void> {
    const db = await getOrdersDb();
    if (!db) {
      if (!userId) {
        this.saveFallback([]);
      } else {
        this.saveFallback(this.loadFallback().filter((o) => o.userId !== userId));
      }
      return;
    }

    if (userId) {
      await db.runAsync('DELETE FROM orders WHERE userId = ?', [userId]);
    } else {
      await db.runAsync('DELETE FROM orders');
    }
  }
}

export const sqliteOrderRepository = new SqliteOrderRepository();
