import { CLINIC_NAME, ROLE_CONFIGS } from '../../application/services/authService';
import { RegisterUserInput, Session, User } from '../../domain/models/user';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

const STORAGE_USERS_KEY = 'amipets_users_v1';
const STORAGE_SESSION_KEY = 'amipets_session_v1';

function readStorage<T>(key: string): T | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
  } catch {
  }
  return null;
}

function writeStorage<T>(key: string, value: T | null): void {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      if (value === null) {
        globalThis.localStorage.removeItem(key);
      } else {
        globalThis.localStorage.setItem(key, JSON.stringify(value));
      }
    }
  } catch {
  }
}

export const DEFAULT_ADMIN_USER: User = {
  id: 'usr_admin',
  userName: 'admin',
  password: 'admin',
  displayName: 'Carlos Mendoza',
  role: 'ADMIN',
  roleLabel: 'Director Médico & Fundador',
  title: 'Dr.',
  clinicName: CLINIC_NAME,
  cmpv: 'C.M.V.P. 8421 · Cirugía & Traumatología',
  createdAt: new Date().toISOString(),
};

export class InMemoryAuthRepository implements IAuthRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    this.users.set(DEFAULT_ADMIN_USER.userName.toLowerCase(), { ...DEFAULT_ADMIN_USER });
    const persisted = readStorage<User[]>(STORAGE_USERS_KEY);
    if (Array.isArray(persisted)) {
      for (const u of persisted) {
        if (u?.userName) {
          this.users.set(u.userName.toLowerCase(), u);
        }
      }
    }
  }

  private persistUsers(): void {
    writeStorage(STORAGE_USERS_KEY, Array.from(this.users.values()));
  }

  getSavedSession(): Session | null {
    return readStorage<Session>(STORAGE_SESSION_KEY);
  }

  saveSession(session: Session | null): void {
    writeStorage(STORAGE_SESSION_KEY, session);
  }

  loginSync(userName: string, password: string): Session | null {
    const cleanUser = userName.trim().toLowerCase();
    const cleanPass = password.trim();

    const user = this.users.get(cleanUser);
    if (!user) {
      return null;
    }

    if (user.password && user.password !== cleanPass) {
      return null;
    }

    const session: Session = {
      userName: user.userName,
      displayName: user.displayName,
      title: user.title,
      clinicName: user.clinicName,
      role: user.roleLabel,
      roleCode: user.role,
      cmpv: user.cmpv,
      shift: user.shift,
    };
    this.saveSession(session);
    return session;
  }

  registerSync(input: RegisterUserInput): Session {
    const cleanUser = input.userName.trim().toLowerCase();
    if (cleanUser === 'admin') {
      throw new Error('El usuario "admin" es exclusivo del Director Médico.');
    }
    const existing = this.users.get(cleanUser);
    if (existing) {
      throw new Error(`El usuario "${cleanUser}" ya se encuentra registrado en el sistema.`);
    }

    const config = ROLE_CONFIGS.RECEPTIONIST;
    const shiftText = input.shift?.trim() || 'Turno Completo (08:00 - 20:00)';

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userName: cleanUser,
      password: input.password.trim(),
      displayName: input.displayName.trim(),
      role: 'RECEPTIONIST',
      roleLabel: config.defaultRoleDescription,
      title: config.defaultTitle,
      clinicName: CLINIC_NAME,
      cmpv: `Recepción · ${shiftText}`,
      shift: shiftText,
      createdAt: new Date().toISOString(),
    };

    this.users.set(cleanUser, newUser);
    this.persistUsers();

    const session: Session = {
      userName: newUser.userName,
      displayName: newUser.displayName,
      title: newUser.title,
      clinicName: newUser.clinicName,
      role: newUser.roleLabel,
      roleCode: newUser.role,
      cmpv: newUser.cmpv,
      shift: newUser.shift,
    };
    this.saveSession(session);
    return session;
  }

  getAllUsersSync(): User[] {
    return Array.from(this.users.values());
  }

  logoutSync(): void {
    this.saveSession(null);
  }

  async login(userName: string, password: string): Promise<Session | null> {
    return this.loginSync(userName, password);
  }

  async register(input: RegisterUserInput): Promise<Session> {
    return this.registerSync(input);
  }

  async getUserByUsername(userName: string): Promise<User | undefined> {
    return this.users.get(userName.trim().toLowerCase());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const authRepository = new InMemoryAuthRepository();
