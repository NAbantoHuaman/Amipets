import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncStatus } from '../../domain/models/order';
import {
  Priority,
  RequestChanges,
  RequestInput,
  RequestStatus,
  ServiceType,
  Species,
  VeterinaryRequest,
} from '../../domain/models/request';
import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { getAppDb, readFallbackRequests, writeFallbackRequests } from '../database/sqlite';

const LEGACY_STORAGE_REQUESTS_KEY = 'amipets_requests_v1';

interface RequestRow {
  id: string;
  userId: string | null;
  clienteNombre: string;
  telefono: string;
  mascotaNombre: string;
  especie: string | null;
  raza: string | null;
  tipoServicio: string;
  prioridad: string;
  descripcion: string;
  estado: string;
  fechaRegistro: string;
  registradoPor: string | null;
  registradoPorUsuario: string | null;
  syncStatus: string | null;
  syncedAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export function generateRequestId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `req_${time}${random}`;
}

function mapRowToRequest(row: RequestRow): VeterinaryRequest {
  const syncStatus: SyncStatus = row.syncStatus === 'SYNCED' ? 'SYNCED' : 'PENDING';
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    clienteNombre: row.clienteNombre,
    telefono: row.telefono,
    mascotaNombre: row.mascotaNombre,
    especie: (row.especie as Species | null) ?? undefined,
    raza: row.raza ?? undefined,
    tipoServicio: row.tipoServicio as ServiceType,
    prioridad: row.prioridad as Priority,
    descripcion: row.descripcion ?? '',
    estado: row.estado as RequestStatus,
    fechaRegistro: row.fechaRegistro,
    registradoPor: row.registradoPor ?? undefined,
    registradoPorUsuario: row.registradoPorUsuario ?? undefined,
    syncStatus,
    syncedAt: row.syncedAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
    deletedAt: row.deletedAt ?? undefined,
  };
}

export class SqliteRequestRepository implements IRequestRepository {
  private memoryFallback: VeterinaryRequest[] = [];

  private loadFallback(): VeterinaryRequest[] {
    const stored = readFallbackRequests<VeterinaryRequest>();
    if (stored.length > 0) {
      this.memoryFallback = stored;
    }
    return [...this.memoryFallback];
  }

  private saveFallback(list: VeterinaryRequest[]): void {
    this.memoryFallback = [...list];
    writeFallbackRequests(this.memoryFallback);
  }

  async migrateLegacyAsyncStorage(
    userId: string,
    defaultRegistradoPor?: string,
    defaultRegistradoPorUsuario?: string,
  ): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(LEGACY_STORAGE_REQUESTS_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          if (!item || typeof item !== 'object') continue;
          const existing = item.id ? await this.getById(String(item.id)) : undefined;
          if (existing) continue;

          await this.create({
            id: typeof item.id === 'string' && item.id ? item.id : generateRequestId(),
            userId,
            clienteNombre: String(item.clienteNombre ?? 'Cliente'),
            telefono: String(item.telefono ?? '999999999'),
            mascotaNombre: String(item.mascotaNombre ?? 'Mascota'),
            especie: item.especie as Species | undefined,
            raza: typeof item.raza === 'string' ? item.raza : undefined,
            tipoServicio: (item.tipoServicio as ServiceType) ?? 'CONSULTA',
            prioridad: (item.prioridad as Priority) ?? 'MEDIA',
            descripcion: String(item.descripcion ?? ''),
            estado: (item.estado as RequestStatus) ?? 'PENDIENTE',
            fechaRegistro:
              typeof item.fechaRegistro === 'string' && item.fechaRegistro
                ? item.fechaRegistro
                : new Date().toISOString(),
            registradoPor: item.registradoPor ?? defaultRegistradoPor,
            registradoPorUsuario: item.registradoPorUsuario ?? defaultRegistradoPorUsuario,
          });
        }
      }

      await AsyncStorage.removeItem(LEGACY_STORAGE_REQUESTS_KEY);
    } catch {
      // Ignore legacy migration errors safely
    }
  }

  async getAll(_userId?: string): Promise<VeterinaryRequest[]> {
    const db = await getAppDb();
    if (!db) {
      return this.loadFallback()
        .filter((r) => !r.deletedAt)
        .sort(
          (a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime(),
        );
    }

    const rows = await db.getAllAsync<RequestRow>(
      'SELECT * FROM requests WHERE deletedAt IS NULL ORDER BY fechaRegistro DESC',
    );
    return rows.map(mapRowToRequest);
  }

  async getPendingSync(_userId?: string): Promise<VeterinaryRequest[]> {
    const db = await getAppDb();
    if (!db) {
      return this.loadFallback().filter(
        (r) => !r.syncStatus || r.syncStatus === 'PENDING',
      );
    }

    const rows = await db.getAllAsync<RequestRow>(
      "SELECT * FROM requests WHERE syncStatus IS NULL OR syncStatus = 'PENDING' ORDER BY fechaRegistro ASC",
    );
    return rows.map(mapRowToRequest);
  }

  async getById(id: string): Promise<VeterinaryRequest | undefined> {
    const db = await getAppDb();
    if (!db) {
      return this.loadFallback().find((r) => r.id === id);
    }

    const row = await db.getFirstAsync<RequestRow>('SELECT * FROM requests WHERE id = ?', [id]);
    return row ? mapRowToRequest(row) : undefined;
  }

  async create(input: RequestInput): Promise<VeterinaryRequest> {
    const now = new Date().toISOString();
    const newRequest: VeterinaryRequest = {
      id: input.id ?? generateRequestId(),
      userId: input.userId,
      clienteNombre: input.clienteNombre.trim(),
      telefono: input.telefono.trim(),
      mascotaNombre: input.mascotaNombre.trim(),
      especie: input.especie,
      raza: input.raza?.trim() || undefined,
      tipoServicio: input.tipoServicio,
      prioridad: input.prioridad,
      descripcion: input.descripcion.trim(),
      estado: input.estado ?? 'PENDIENTE',
      fechaRegistro: input.fechaRegistro ?? now,
      registradoPor: input.registradoPor?.trim() || undefined,
      registradoPorUsuario: input.registradoPorUsuario?.trim() || undefined,
      syncStatus: 'PENDING',
      updatedAt: now,
    };

    const db = await getAppDb();
    if (!db) {
      const current = this.loadFallback().filter((r) => r.id !== newRequest.id);
      this.saveFallback([newRequest, ...current]);
      return newRequest;
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO requests (
        id, userId, clienteNombre, telefono, mascotaNombre, especie, raza,
        tipoServicio, prioridad, descripcion, estado, fechaRegistro,
        registradoPor, registradoPorUsuario, syncStatus, syncedAt, updatedAt, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newRequest.id,
        newRequest.userId ?? null,
        newRequest.clienteNombre,
        newRequest.telefono,
        newRequest.mascotaNombre,
        newRequest.especie ?? null,
        newRequest.raza ?? null,
        newRequest.tipoServicio,
        newRequest.prioridad,
        newRequest.descripcion,
        newRequest.estado,
        newRequest.fechaRegistro,
        newRequest.registradoPor ?? null,
        newRequest.registradoPorUsuario ?? null,
        newRequest.syncStatus ?? 'PENDING',
        newRequest.syncedAt ?? null,
        newRequest.updatedAt ?? now,
        null,
      ],
    );

    return newRequest;
  }

  async update(id: string, changes: RequestChanges): Promise<VeterinaryRequest> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Solicitud con ID ${id} no encontrada.`);
    }

    const now = new Date().toISOString();
    const updated: VeterinaryRequest = {
      ...existing,
      ...changes,
      id: existing.id,
      userId: existing.userId ?? changes.userId,
      clienteNombre: (changes.clienteNombre ?? existing.clienteNombre).trim(),
      telefono: (changes.telefono ?? existing.telefono).trim(),
      mascotaNombre: (changes.mascotaNombre ?? existing.mascotaNombre).trim(),
      especie: 'especie' in changes ? changes.especie : existing.especie,
      raza:
        'raza' in changes ? changes.raza?.trim() || undefined : existing.raza,
      tipoServicio: changes.tipoServicio ?? existing.tipoServicio,
      prioridad: changes.prioridad ?? existing.prioridad,
      descripcion:
        changes.descripcion !== undefined ? changes.descripcion.trim() : existing.descripcion,
      estado: changes.estado ?? existing.estado,
      fechaRegistro: changes.fechaRegistro ?? existing.fechaRegistro,
      registradoPor:
        changes.registradoPor !== undefined
          ? changes.registradoPor.trim() || undefined
          : existing.registradoPor,
      registradoPorUsuario:
        changes.registradoPorUsuario !== undefined
          ? changes.registradoPorUsuario.trim() || undefined
          : existing.registradoPorUsuario,
      updatedAt: now,
      syncStatus: changes.syncStatus ?? 'PENDING',
    };

    const db = await getAppDb();
    if (!db) {
      const list = this.loadFallback().map((r) => (r.id === id ? updated : r));
      this.saveFallback(list);
      return updated;
    }

    await db.runAsync(
      `UPDATE requests SET
        userId = ?,
        clienteNombre = ?,
        telefono = ?,
        mascotaNombre = ?,
        especie = ?,
        raza = ?,
        tipoServicio = ?,
        prioridad = ?,
        descripcion = ?,
        estado = ?,
        fechaRegistro = ?,
        registradoPor = ?,
        registradoPorUsuario = ?,
        syncStatus = ?,
        syncedAt = ?,
        updatedAt = ?,
        deletedAt = ?
      WHERE id = ?`,
      [
        updated.userId ?? null,
        updated.clienteNombre,
        updated.telefono,
        updated.mascotaNombre,
        updated.especie ?? null,
        updated.raza ?? null,
        updated.tipoServicio,
        updated.prioridad,
        updated.descripcion,
        updated.estado,
        updated.fechaRegistro,
        updated.registradoPor ?? null,
        updated.registradoPorUsuario ?? null,
        updated.syncStatus ?? 'PENDING',
        updated.syncedAt ?? null,
        updated.updatedAt ?? now,
        updated.deletedAt ?? null,
        updated.id,
      ],
    );

    return updated;
  }

  async changeStatus(id: string, status: RequestStatus): Promise<VeterinaryRequest> {
    return this.update(id, { estado: status });
  }

  async markSynced(id: string, syncedAt: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;

    const db = await getAppDb();
    if (!db) {
      const list = this.loadFallback().map((r) =>
        r.id === id ? { ...r, syncStatus: 'SYNCED' as SyncStatus, syncedAt } : r,
      );
      this.saveFallback(list);
      return;
    }

    await db.runAsync(
      `UPDATE requests SET syncStatus = 'SYNCED', syncedAt = ? WHERE id = ?`,
      [syncedAt, id],
    );
  }

  async upsertFromRemote(request: VeterinaryRequest): Promise<void> {
    const existing = await this.getById(request.id);
    if (existing && (existing.syncStatus === 'PENDING' || existing.deletedAt)) {
      return;
    }

    const merged: VeterinaryRequest = {
      ...request,
      syncStatus: 'SYNCED',
      deletedAt: undefined,
    };

    const db = await getAppDb();
    if (!db) {
      const current = this.loadFallback();
      const exists = current.some((r) => r.id === merged.id);
      const next = exists
        ? current.map((r) => (r.id === merged.id ? merged : r))
        : [merged, ...current];
      this.saveFallback(next);
      return;
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO requests (
        id, userId, clienteNombre, telefono, mascotaNombre, especie, raza,
        tipoServicio, prioridad, descripcion, estado, fechaRegistro,
        registradoPor, registradoPorUsuario, syncStatus, syncedAt, updatedAt, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merged.id,
        merged.userId ?? null,
        merged.clienteNombre,
        merged.telefono,
        merged.mascotaNombre,
        merged.especie ?? null,
        merged.raza ?? null,
        merged.tipoServicio,
        merged.prioridad,
        merged.descripcion,
        merged.estado,
        merged.fechaRegistro,
        merged.registradoPor ?? null,
        merged.registradoPorUsuario ?? null,
        'SYNCED',
        merged.syncedAt ?? merged.updatedAt ?? new Date().toISOString(),
        merged.updatedAt ?? merged.fechaRegistro,
        null,
      ],
    );
  }

  async reconcileRemoteSnapshot(
    _userId: string,
    remoteRequests: VeterinaryRequest[],
  ): Promise<void> {
    const remoteIds = new Set(remoteRequests.map((r) => r.id));
    for (const remote of remoteRequests) {
      await this.upsertFromRemote(remote);
    }

    const localActive = await this.getAll();
    for (const local of localActive) {
      if (local.syncStatus === 'SYNCED' && !remoteIds.has(local.id)) {
        await this.hardDelete(local.id);
      }
    }
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    if (existing.syncStatus === 'SYNCED' && existing.userId) {
      const now = new Date().toISOString();
      const db = await getAppDb();
      if (!db) {
        const list = this.loadFallback().map((r) =>
          r.id === id
            ? {
                ...r,
                deletedAt: now,
                updatedAt: now,
                syncStatus: 'PENDING' as SyncStatus,
              }
            : r,
        );
        this.saveFallback(list);
        return true;
      }

      const result = await db.runAsync(
        `UPDATE requests SET deletedAt = ?, updatedAt = ?, syncStatus = 'PENDING' WHERE id = ?`,
        [now, now, id],
      );
      return result.changes > 0;
    }

    return this.hardDelete(id);
  }

  async hardDelete(id: string): Promise<boolean> {
    const db = await getAppDb();
    if (!db) {
      const current = this.loadFallback();
      const filtered = current.filter((r) => r.id !== id);
      this.saveFallback(filtered);
      return filtered.length < current.length;
    }

    const result = await db.runAsync('DELETE FROM requests WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async clearAll(userId?: string): Promise<void> {
    const db = await getAppDb();
    if (!db) {
      if (!userId) {
        this.saveFallback([]);
      } else {
        this.saveFallback(this.loadFallback().filter((r) => r.userId !== userId));
      }
      return;
    }

    if (userId) {
      await db.runAsync('DELETE FROM requests WHERE userId = ?', [userId]);
    } else {
      await db.runAsync('DELETE FROM requests');
    }
  }
}

export const sqliteRequestRepository = new SqliteRequestRepository();
