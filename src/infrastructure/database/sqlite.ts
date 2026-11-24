import { Platform } from 'react-native';
import type * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'amipets_store.db';
export const ORDERS_FALLBACK_STORAGE_KEY = 'amipets_sqlite_orders_v1';
export const REQUESTS_FALLBACK_STORAGE_KEY = 'amipets_sqlite_requests_v1';
export const SETTINGS_FALLBACK_STORAGE_KEY = 'amipets_sqlite_settings_v1';
export const USERS_FALLBACK_STORAGE_KEY = 'amipets_sqlite_users_v1';

const CREATE_USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL,
    displayName TEXT NOT NULL,
    role TEXT NOT NULL,
    roleLabel TEXT NOT NULL,
    title TEXT NOT NULL,
    clinicName TEXT NOT NULL,
    cmpv TEXT,
    shift TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT
  );
`;

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

const CREATE_REQUESTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY NOT NULL,
    userId TEXT,
    clienteNombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    mascotaNombre TEXT NOT NULL,
    especie TEXT,
    raza TEXT,
    tipoServicio TEXT NOT NULL,
    prioridad TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL,
    fechaRegistro TEXT NOT NULL,
    registradoPor TEXT,
    registradoPorUsuario TEXT,
    syncStatus TEXT,
    syncedAt TEXT,
    updatedAt TEXT,
    deletedAt TEXT
  );
`;

const CREATE_USER_SETTINGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS user_settings (
    userId TEXT PRIMARY KEY NOT NULL,
    servicePricesJson TEXT NOT NULL,
    prefsJson TEXT NOT NULL,
    readIdsJson TEXT NOT NULL,
    syncStatus TEXT,
    syncedAt TEXT,
    updatedAt TEXT NOT NULL
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

const EXTRA_REQUEST_COLUMNS = [
  { name: 'userId', definition: 'userId TEXT' },
  { name: 'especie', definition: 'especie TEXT' },
  { name: 'raza', definition: 'raza TEXT' },
  { name: 'registradoPor', definition: 'registradoPor TEXT' },
  { name: 'registradoPorUsuario', definition: 'registradoPorUsuario TEXT' },
  { name: 'syncStatus', definition: 'syncStatus TEXT' },
  { name: 'syncedAt', definition: 'syncedAt TEXT' },
  { name: 'updatedAt', definition: 'updatedAt TEXT' },
  { name: 'deletedAt', definition: 'deletedAt TEXT' },
] as const;

let dbPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;
let nativeSqliteActive = false;

async function migrateTableColumns(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  extraColumns: readonly { name: string; definition: string }[],
): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  const existing = new Set(columns.map((c) => c.name));

  for (const col of extraColumns) {
    if (!existing.has(col.name)) {
      await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${col.definition};`);
    }
  }
}

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') {
    nativeSqliteActive = false;
    return null;
  }

  try {
    const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync(CREATE_USERS_TABLE_SQL);
    await db.execAsync(CREATE_ORDERS_TABLE_SQL);
    await db.execAsync(CREATE_REQUESTS_TABLE_SQL);
    await db.execAsync(CREATE_USER_SETTINGS_TABLE_SQL);
    await migrateTableColumns(db, 'orders', EXTRA_ORDER_COLUMNS);
    await migrateTableColumns(db, 'requests', EXTRA_REQUEST_COLUMNS);
    nativeSqliteActive = true;
    return db;
  } catch {
    nativeSqliteActive = false;
    return null;
  }
}

export async function getAppDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (!dbPromise) {
    dbPromise = initializeDatabase();
  }
  return dbPromise;
}

export const getOrdersDb = getAppDb;

export function isUsingNativeSqlite(): boolean {
  return nativeSqliteActive;
}

function readJsonListFallback<T>(key: string): T[] {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    }
  } catch {
    // Fallback to empty list if storage is unavailable
  }
  return [];
}

function writeJsonListFallback<T>(key: string, items: T[]): void {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(key, JSON.stringify(items));
    }
  } catch {
    // Ignore storage write failures
  }
}

export function readFallbackOrders<T>(): T[] {
  return readJsonListFallback<T>(ORDERS_FALLBACK_STORAGE_KEY);
}

export function writeFallbackOrders<T>(orders: T[]): void {
  writeJsonListFallback<T>(ORDERS_FALLBACK_STORAGE_KEY, orders);
}

export function readFallbackRequests<T>(): T[] {
  return readJsonListFallback<T>(REQUESTS_FALLBACK_STORAGE_KEY);
}

export function writeFallbackRequests<T>(requests: T[]): void {
  writeJsonListFallback<T>(REQUESTS_FALLBACK_STORAGE_KEY, requests);
}

export function readFallbackUserSettings<T>(): T[] {
  return readJsonListFallback<T>(SETTINGS_FALLBACK_STORAGE_KEY);
}

export function writeFallbackUserSettings<T>(settingsList: T[]): void {
  writeJsonListFallback<T>(SETTINGS_FALLBACK_STORAGE_KEY, settingsList);
}

export function readFallbackUsers<T>(): T[] {
  return readJsonListFallback<T>(USERS_FALLBACK_STORAGE_KEY);
}

export function writeFallbackUsers<T>(users: T[]): void {
  writeJsonListFallback<T>(USERS_FALLBACK_STORAGE_KEY, users);
}
