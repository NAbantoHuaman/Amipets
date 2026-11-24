import { User, UserRole } from '../../domain/models/user';
import { getAppDb, readFallbackUsers, writeFallbackUsers } from '../database/sqlite';

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  roleLabel: string;
  title: string;
  clinicName: string;
  cmpv: string | null;
  shift: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.uid,
    userName: row.email,
    email: row.email,
    displayName: row.displayName,
    role: (row.role as UserRole) || 'RECEPTIONIST',
    roleLabel: row.roleLabel,
    title: row.title,
    clinicName: row.clinicName,
    cmpv: row.cmpv ?? undefined,
    shift: row.shift ?? undefined,
    createdAt: row.createdAt,
  };
}

export class SqliteUserRepository {
  private memoryFallback: User[] = [];

  private loadFallback(): User[] {
    const stored = readFallbackUsers<User>();
    if (stored.length > 0) {
      this.memoryFallback = stored;
    }
    return [...this.memoryFallback];
  }

  private saveFallback(list: User[]): void {
    this.memoryFallback = [...list];
    writeFallbackUsers(this.memoryFallback);
  }

  async getByUid(uid: string): Promise<User | undefined> {
    const db = await getAppDb();
    if (!db) {
      return this.loadFallback().find((u) => u.id === uid);
    }

    const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE uid = ?', [uid]);
    return row ? mapRowToUser(row) : undefined;
  }

  async getAll(): Promise<User[]> {
    const db = await getAppDb();
    const sortStaff = (list: User[]) =>
      [...list].sort((a, b) => {
        if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
        if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
        return a.displayName.localeCompare(b.displayName);
      });

    if (!db) {
      return sortStaff(this.loadFallback());
    }

    const rows = await db.getAllAsync<UserRow>('SELECT * FROM users');
    return sortStaff(rows.map(mapRowToUser));
  }

  async replaceAll(users: User[]): Promise<void> {
    const now = new Date().toISOString();
    const db = await getAppDb();
    if (!db) {
      this.saveFallback(users);
      return;
    }

    await db.execAsync('DELETE FROM users');
    for (const u of users) {
      await this.upsert(u, now);
    }
  }

  async upsert(user: User, updatedAt?: string): Promise<void> {
    const now = updatedAt ?? new Date().toISOString();
    const db = await getAppDb();
    if (!db) {
      const current = this.loadFallback().filter((u) => u.id !== user.id);
      this.saveFallback([user, ...current]);
      return;
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO users (
        uid, email, displayName, role, roleLabel, title, clinicName, cmpv, shift, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email ?? user.userName,
        user.displayName,
        user.role,
        user.roleLabel,
        user.title,
        user.clinicName,
        user.cmpv ?? null,
        user.shift ?? null,
        user.createdAt,
        now,
      ],
    );
  }
}

export const sqliteUserRepository = new SqliteUserRepository();
