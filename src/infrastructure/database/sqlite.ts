import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'amipets_store.db';
export const ORDERS_FALLBACK_STORAGE_KEY = 'amipets_sqlite_orders_v1';

const CREATE_ORDERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL,
    userId TEXT,
    clienteNombre TEXT NOT NULL,
    telefono TEXT,
    mascotaNombre TEXT,
    especie TEXT,
    productoId INTEGER,
    marca TEXT,
    sku TEXT,
    categoria TEXT NOT NULL,
    producto TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio REAL NOT NULL,
    notas TEXT,
    estado TEXT NOT NULL,
    fechaRegistro TEXT NOT NULL,
    registradoPor TEXT,
    registradoPorUsuario TEXT,
    syncStatus TEXT,
    syncedAt TEXT,
    updatedAt TEXT,
    comprobanteLocalUri TEXT,
    comprobanteUrl TEXT,
    deletedAt TEXT
  );
`;

const EXTRA_ORDER_COLUMNS = [
  { name: 'userId', definition: 'userId TEXT' },
  { name: 'productoId', definition: 'productoId INTEGER' },
  { name: 'marca', definition: 'marca TEXT' },
  { name: 'sku', definition: 'sku TEXT' },
  { name: 'registradoPor', definition: 'registradoPor TEXT' },
  { name: 'registradoPorUsuario', definition: 'registradoPorUsuario TEXT' },
  { name: 'syncStatus', definition: 'syncStatus TEXT' },
  { name: 'syncedAt', definition: 'syncedAt TEXT' },
  { name: 'updatedAt', definition: 'updatedAt TEXT' },
  { name: 'comprobanteLocalUri', definition: 'comprobanteLocalUri TEXT' },
  { name: 'comprobanteUrl', definition: 'comprobanteUrl TEXT' },
  { name: 'deletedAt', definition: 'deletedAt TEXT' },
] as const;

let dbPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;
let nativeSqliteActive = false;

async function migrateOrdersTable(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(orders)');
  const existing = new Set(columns.map((c) => c.name));

  for (const col of EXTRA_ORDER_COLUMNS) {
    if (!existing.has(col.name)) {
      await db.execAsync(`ALTER TABLE orders ADD COLUMN ${col.definition};`);
    }
  }
}

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') {
    nativeSqliteActive = false;
    return null;
  }

  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync(CREATE_ORDERS_TABLE_SQL);
    await migrateOrdersTable(db);
    nativeSqliteActive = true;
    return db;
  } catch {
    nativeSqliteActive = false;
    return null;
  }
}

export async function getOrdersDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (!dbPromise) {
    dbPromise = initializeDatabase();
  }
  return dbPromise;
}

export function isUsingNativeSqlite(): boolean {
  return nativeSqliteActive;
}

export function readFallbackOrders<T>(): T[] {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(ORDERS_FALLBACK_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    }
  } catch {
    // Fallback to empty list if storage is unavailable
  }
  return [];
}

export function writeFallbackOrders<T>(orders: T[]): void {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(ORDERS_FALLBACK_STORAGE_KEY, JSON.stringify(orders));
    }
  } catch {
    // Ignore storage write failures
  }
}
