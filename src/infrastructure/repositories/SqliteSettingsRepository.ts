import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncStatus } from '../../domain/models/order';
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SERVICE_PRICES,
  ServicePrices,
  UserAppSettings,
  UserNotificationPrefs,
} from '../../domain/models/request';
import { getAppDb, readFallbackUserSettings, writeFallbackUserSettings } from '../database/sqlite';

const LEGACY_PRICES_KEY = 'amipets_service_prices_v1';
const LEGACY_PREFS_KEY = 'amipets_settings_prefs_v1';
const LEGACY_NOTIFS_KEY = 'amipets_notif_read_v1';
const MAX_READ_IDS = 250;

interface UserSettingsRow {
  userId: string;
  servicePricesJson: string;
  prefsJson: string;
  readIdsJson: string;
  syncStatus: string | null;
  syncedAt: string | null;
  updatedAt: string;
}

function sanitizePrices(raw?: Partial<ServicePrices> | null): ServicePrices {
  const num = (val: unknown, def: number) => {
    const parsed = Number(val);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 50000 ? parsed : def;
  };
  return {
    CONSULTA: num(raw?.CONSULTA, DEFAULT_SERVICE_PRICES.CONSULTA),
    VACUNACION: num(raw?.VACUNACION, DEFAULT_SERVICE_PRICES.VACUNACION),
    EMERGENCIA: num(raw?.EMERGENCIA, DEFAULT_SERVICE_PRICES.EMERGENCIA),
    GROOMING: num(raw?.GROOMING, DEFAULT_SERVICE_PRICES.GROOMING),
  };
}

function sanitizePrefs(raw?: Partial<UserNotificationPrefs> | null): UserNotificationPrefs {
  return {
    notifyUrgent:
      typeof raw?.notifyUrgent === 'boolean'
        ? raw.notifyUrgent
        : DEFAULT_NOTIFICATION_PREFS.notifyUrgent,
    soundAlerts:
      typeof raw?.soundAlerts === 'boolean'
        ? raw.soundAlerts
        : DEFAULT_NOTIFICATION_PREFS.soundAlerts,
    vaccineReminders:
      typeof raw?.vaccineReminders === 'boolean'
        ? raw.vaccineReminders
        : DEFAULT_NOTIFICATION_PREFS.vaccineReminders,
  };
}

function sanitizeReadIds(raw?: unknown): string[] {
  if (Array.isArray(raw)) {
    const unique = Array.from(
      new Set(raw.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 120)),
    );
    return unique.slice(-MAX_READ_IDS);
  }
  if (raw && typeof raw === 'object') {
    const keys = Object.entries(raw as Record<string, unknown>)
      .filter(([k, v]) => Boolean(v) && k.length > 0 && k.length <= 120)
      .map(([k]) => k);
    return keys.slice(-MAX_READ_IDS);
  }
  return [];
}

function parseRow(row: UserSettingsRow): UserAppSettings {
  let prices = DEFAULT_SERVICE_PRICES;
  let prefs = DEFAULT_NOTIFICATION_PREFS;
  let readIds: string[] = [];

  try {
    prices = sanitizePrices(JSON.parse(row.servicePricesJson));
  } catch {
    prices = { ...DEFAULT_SERVICE_PRICES };
  }

  try {
    prefs = sanitizePrefs(JSON.parse(row.prefsJson));
  } catch {
    prefs = { ...DEFAULT_NOTIFICATION_PREFS };
  }

  try {
    readIds = sanitizeReadIds(JSON.parse(row.readIdsJson));
  } catch {
    readIds = [];
  }

  const syncStatus: SyncStatus = row.syncStatus === 'SYNCED' ? 'SYNCED' : 'PENDING';

  return {
    userId: row.userId,
    servicePrices: prices,
    prefs,
    readIds,
    syncStatus,
    syncedAt: row.syncedAt ?? undefined,
    updatedAt: row.updatedAt,
  };
}

export class SqliteSettingsRepository {
  private memoryFallback: UserAppSettings[] = [];

  private loadFallback(): UserAppSettings[] {
    const stored = readFallbackUserSettings<UserAppSettings>();
    if (stored.length > 0) {
      this.memoryFallback = stored;
    }
    return [...this.memoryFallback];
  }

  private saveFallback(list: UserAppSettings[]): void {
    this.memoryFallback = [...list];
    writeFallbackUserSettings(this.memoryFallback);
  }

  async migrateLegacyAsyncStorage(userId: string): Promise<void> {
    try {
      const [rawPrices, rawPrefs, rawNotifs] = await Promise.all([
        AsyncStorage.getItem(LEGACY_PRICES_KEY),
        AsyncStorage.getItem(LEGACY_PREFS_KEY),
        AsyncStorage.getItem(LEGACY_NOTIFS_KEY),
      ]);

      if (!rawPrices && !rawPrefs && !rawNotifs) return;

      const existing = await this.getByUserId(userId);
      if (!existing) {
        const parsedPrices = rawPrices ? JSON.parse(rawPrices) : null;
        const parsedPrefs = rawPrefs ? JSON.parse(rawPrefs) : null;
        const parsedNotifs = rawNotifs ? JSON.parse(rawNotifs) : null;

        await this.saveLocal({
          userId,
          servicePrices: sanitizePrices(parsedPrices),
          prefs: sanitizePrefs(parsedPrefs),
          readIds: sanitizeReadIds(parsedNotifs),
          updatedAt: new Date().toISOString(),
        });
      }

      await Promise.all([
        AsyncStorage.removeItem(LEGACY_PRICES_KEY),
        AsyncStorage.removeItem(LEGACY_PREFS_KEY),
        AsyncStorage.removeItem(LEGACY_NOTIFS_KEY),
      ]);
    } catch {
      // Ignore legacy migration errors
    }
  }

  async getByUserId(userId: string): Promise<UserAppSettings | undefined> {
    const db = await getAppDb();
    if (!db) {
      return this.loadFallback().find((s) => s.userId === userId);
    }

    const row = await db.getFirstAsync<UserSettingsRow>(
      'SELECT * FROM user_settings WHERE userId = ?',
      [userId],
    );
    return row ? parseRow(row) : undefined;
  }

  async getOrCreate(userId: string): Promise<UserAppSettings> {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;

    const initial: UserAppSettings = {
      userId,
      servicePrices: { ...DEFAULT_SERVICE_PRICES },
      prefs: { ...DEFAULT_NOTIFICATION_PREFS },
      readIds: [],
      syncStatus: 'SYNCED',
      updatedAt: new Date().toISOString(),
    };
    return initial;
  }

  async saveLocal(input: {
    userId: string;
    servicePrices: ServicePrices;
    prefs: UserNotificationPrefs;
    readIds: string[];
    updatedAt?: string;
  }): Promise<UserAppSettings> {
    const now = input.updatedAt ?? new Date().toISOString();
    const record: UserAppSettings = {
      userId: input.userId,
      servicePrices: sanitizePrices(input.servicePrices),
      prefs: sanitizePrefs(input.prefs),
      readIds: sanitizeReadIds(input.readIds),
      syncStatus: 'PENDING',
      updatedAt: now,
    };

    const db = await getAppDb();
    if (!db) {
      const current = this.loadFallback().filter((s) => s.userId !== record.userId);
      this.saveFallback([record, ...current]);
      return record;
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO user_settings (
        userId, servicePricesJson, prefsJson, readIdsJson, syncStatus, syncedAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.userId,
        JSON.stringify(record.servicePrices),
        JSON.stringify(record.prefs),
        JSON.stringify(record.readIds),
        'PENDING',
        null,
        record.updatedAt,
      ],
    );

    return record;
  }

  async markSynced(userId: string, syncedAt: string): Promise<void> {
    const db = await getAppDb();
    if (!db) {
      const list = this.loadFallback().map((s) =>
        s.userId === userId ? { ...s, syncStatus: 'SYNCED' as SyncStatus, syncedAt } : s,
      );
      this.saveFallback(list);
      return;
    }

    await db.runAsync(
      `UPDATE user_settings SET syncStatus = 'SYNCED', syncedAt = ? WHERE userId = ?`,
      [syncedAt, userId],
    );
  }

  async upsertFromRemote(remote: UserAppSettings): Promise<UserAppSettings> {
    const existing = await this.getByUserId(remote.userId);
    if (existing && existing.syncStatus === 'PENDING') {
      return existing;
    }

    const merged: UserAppSettings = {
      userId: remote.userId,
      servicePrices: sanitizePrices(remote.servicePrices),
      prefs: sanitizePrefs(remote.prefs),
      readIds: sanitizeReadIds(remote.readIds),
      syncStatus: 'SYNCED',
      syncedAt: remote.syncedAt ?? new Date().toISOString(),
      updatedAt: remote.updatedAt || new Date().toISOString(),
    };

    const db = await getAppDb();
    if (!db) {
      const current = this.loadFallback().filter((s) => s.userId !== merged.userId);
      this.saveFallback([merged, ...current]);
      return merged;
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO user_settings (
        userId, servicePricesJson, prefsJson, readIdsJson, syncStatus, syncedAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        merged.userId,
        JSON.stringify(merged.servicePrices),
        JSON.stringify(merged.prefs),
        JSON.stringify(merged.readIds),
        'SYNCED',
        merged.syncedAt ?? null,
        merged.updatedAt,
      ],
    );

    return merged;
  }
}

export const sqliteSettingsRepository = new SqliteSettingsRepository();
