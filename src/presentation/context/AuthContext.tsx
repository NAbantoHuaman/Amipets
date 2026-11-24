import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import {
  buildSessionFromUser,
  buildUnifiedRoleFields,
  CLINIC_NAME,
  fullName,
  isDesignatedAdminAccount,
  mapFirebaseAuthError,
  ROLE_CONFIGS,
  shortGreetingName,
} from '../../application/services/authService';
import { RegisterUserInput, Session, User, UserRole } from '../../domain/models/user';
import { sqliteUserRepository } from '../../infrastructure/repositories/SqliteUserRepository';
import { firebaseAuth, firestoreDb } from '../../infrastructure/services/firebaseConfig';

export { CLINIC_NAME, fullName, shortGreetingName };
export type { RegisterUserInput, Session, User };

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue {
  session: Session | null;
  initializing: boolean;
  isAdmin: boolean;
  staffList: User[];
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (input: RegisterUserInput) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const VALID_ROLES: UserRole[] = ['ADMIN', 'VETERINARIAN', 'RECEPTIONIST', 'ASSISTANT'];

function isValidUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole);
}

function buildFallbackUser(fbUser: FirebaseUser): User {
  const email = (fbUser.email ?? '').trim().toLowerCase();
  const roleCode: UserRole = isDesignatedAdminAccount(email, fbUser.uid) ? 'ADMIN' : 'RECEPTIONIST';
  const shiftText = 'Turno Completo (08:00 - 20:00)';
  const roleFields = buildUnifiedRoleFields(roleCode, shiftText);
  const fallbackName =
    fbUser.displayName?.trim() ||
    (roleCode === 'ADMIN' ? 'Carlos Herrera' : email.split('@')[0] || 'Colaborador');

  return {
    id: fbUser.uid,
    userName: email,
    email,
    displayName: fallbackName,
    role: roleFields.role,
    roleLabel: roleFields.roleLabel,
    title: roleFields.title,
    clinicName: roleFields.clinicName,
    cmpv: roleFields.cmpv,
    shift: roleFields.shift,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [staffList, setStaffList] = useState<User[]>([]);

  const applyUnifiedUser = useCallback((user: User) => {
    setSession(buildSessionFromUser(user));
    void sqliteUserRepository
      .upsert(user)
      .then(() => sqliteUserRepository.getAll())
      .then((allStaff) => {
        if (allStaff.length > 0) setStaffList(allStaff);
        else setStaffList([user]);
      })
      .catch(() => {
        setStaffList([user]);
      });
  }, []);

  useEffect(() => {
    let profileUnsub: Unsubscribe | null = null;
    let rosterUnsub: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }
      if (rosterUnsub) {
        rosterUnsub();
        rosterUnsub = null;
      }

      if (!fbUser) {
        setSession(null);
        setStaffList([]);
        setInitializing(false);
        return;
      }

      const cachedLocal = await sqliteUserRepository.getByUid(fbUser.uid).catch(() => undefined);
      const fallbackUser = cachedLocal ?? buildFallbackUser(fbUser);

      // Ensure designated admin is immediately reflected even before remote snapshot arrives
      if (isDesignatedAdminAccount(fbUser.email, fbUser.uid) && fallbackUser.role !== 'ADMIN') {
        const healedFields = buildUnifiedRoleFields('ADMIN', fallbackUser.shift || 'Turno Completo (08:00 - 20:00)');
        applyUnifiedUser({
          ...fallbackUser,
          ...healedFields,
        });
      } else {
        applyUnifiedUser(fallbackUser);
      }
      setInitializing(false);

      const userDocRef = doc(firestoreDb, 'users', fbUser.uid);
      profileUnsub = onSnapshot(
        userDocRef,
        (snap) => {
          const cleanEmail = (fbUser.email ?? '').trim().toLowerCase();
          const mustBeAdmin = isDesignatedAdminAccount(cleanEmail, fbUser.uid);

          if (!snap.exists()) {
            const baseUser = buildFallbackUser(fbUser);
            applyUnifiedUser(baseUser);
            const now = new Date().toISOString();
            void setDoc(
              userDocRef,
              {
                displayName: baseUser.displayName,
                email: cleanEmail,
                role: baseUser.role,
                roleLabel: baseUser.roleLabel,
                title: baseUser.title,
                clinicName: baseUser.clinicName,
                cmpv: baseUser.cmpv ?? '',
                shift: baseUser.shift ?? 'Turno Completo (08:00 - 20:00)',
                createdAt: baseUser.createdAt,
                updatedAt: now,
              },
              { merge: true },
            ).catch(() => {});
            return;
          }

          const data = snap.data() as Record<string, any>;
          const storedRole: UserRole = isValidUserRole(data.role) ? data.role : 'RECEPTIONIST';
          const effectiveRole: UserRole = mustBeAdmin ? 'ADMIN' : storedRole;
          const cfg = ROLE_CONFIGS[effectiveRole];
          const shiftText =
            typeof data.shift === 'string' && data.shift
              ? data.shift
              : fallbackUser.shift || 'Turno Completo (08:00 - 20:00)';
          const expectedAdminFields = buildUnifiedRoleFields('ADMIN', shiftText);

          // Auto-reconcile Firestore if designated admin was previously stored as RECEPTIONIST
          const needsAdminFirestoreHeal =
            mustBeAdmin &&
            (data.role !== 'ADMIN' ||
              data.title !== expectedAdminFields.title ||
              data.roleLabel !== expectedAdminFields.roleLabel);

          const displayName =
            typeof data.displayName === 'string' && data.displayName
              ? data.displayName
              : fallbackUser.displayName;
          const email =
            typeof data.email === 'string' && data.email ? data.email : cleanEmail;
          const createdAt =
            typeof data.createdAt === 'string' && data.createdAt
              ? data.createdAt
              : fallbackUser.createdAt;

          const unifiedUser: User = {
            id: fbUser.uid,
            userName: email,
            email,
            displayName,
            role: effectiveRole,
            roleLabel: needsAdminFirestoreHeal
              ? expectedAdminFields.roleLabel
              : typeof data.roleLabel === 'string' && data.roleLabel && data.role === effectiveRole
              ? data.roleLabel
              : cfg.defaultRoleDescription,
            title: needsAdminFirestoreHeal
              ? expectedAdminFields.title
              : typeof data.title === 'string' && data.title && data.role === effectiveRole
              ? data.title
              : cfg.defaultTitle,
            clinicName:
              typeof data.clinicName === 'string' && data.clinicName
                ? data.clinicName
                : CLINIC_NAME,
            cmpv: needsAdminFirestoreHeal
              ? expectedAdminFields.cmpv
              : typeof data.cmpv === 'string' && data.cmpv && data.role === effectiveRole
              ? data.cmpv
              : buildUnifiedRoleFields(effectiveRole, shiftText).cmpv,
            shift: shiftText,
            createdAt,
          };

          applyUnifiedUser(unifiedUser);

          if (needsAdminFirestoreHeal) {
            void setDoc(
              userDocRef,
              {
                displayName: unifiedUser.displayName,
                email: unifiedUser.email,
                role: 'ADMIN',
                roleLabel: expectedAdminFields.roleLabel,
                title: expectedAdminFields.title,
                clinicName: unifiedUser.clinicName,
                cmpv: expectedAdminFields.cmpv,
                shift: shiftText,
                createdAt,
                updatedAt: new Date().toISOString(),
              },
              { merge: true },
            ).catch(() => {});
          }
        },
        () => {
          // Offline or unreachable Firestore: keep SQLite / fallback user smoothly
        },
      );

      rosterUnsub = onSnapshot(
        collection(firestoreDb, 'users'),
        (snapshot) => {
          const allUsers: User[] = snapshot.docs.map((d) => {
            const raw = d.data() as Record<string, any>;
            const email = String(raw.email ?? '').trim().toLowerCase();
            const isDesignated = isDesignatedAdminAccount(email, d.id);
            const role: UserRole = isDesignated
              ? 'ADMIN'
              : isValidUserRole(raw.role)
              ? raw.role
              : 'RECEPTIONIST';
            const shiftText =
              typeof raw.shift === 'string' && raw.shift
                ? raw.shift
                : 'Turno Completo (08:00 - 20:00)';
            const defaults = buildUnifiedRoleFields(role, shiftText);

            return {
              id: d.id,
              userName: email || d.id,
              email,
              displayName: String(raw.displayName ?? (email.split('@')[0] || 'Colaborador')),
              role,
              roleLabel:
                isDesignated
                  ? defaults.roleLabel
                  : typeof raw.roleLabel === 'string' && raw.roleLabel
                  ? raw.roleLabel
                  : defaults.roleLabel,
              title:
                isDesignated
                  ? defaults.title
                  : typeof raw.title === 'string' && raw.title
                  ? raw.title
                  : defaults.title,
              clinicName:
                typeof raw.clinicName === 'string' && raw.clinicName
                  ? raw.clinicName
                  : CLINIC_NAME,
              cmpv:
                isDesignated
                  ? defaults.cmpv
                  : typeof raw.cmpv === 'string' && raw.cmpv
                  ? raw.cmpv
                  : defaults.cmpv,
              shift: shiftText,
              createdAt:
                typeof raw.createdAt === 'string' && raw.createdAt
                  ? raw.createdAt
                  : new Date().toISOString(),
            };
          });

          if (allUsers.length > 0) {
            void sqliteUserRepository
              .replaceAll(allUsers)
              .then(() => sqliteUserRepository.getAll())
              .then((sorted) => setStaffList(sorted))
              .catch(() => setStaffList(allUsers));
          }
        },
        () => {
          // Offline fallback uses SQLite cached staff list
        },
      );
    });

    return () => {
      if (profileUnsub) profileUnsub();
      if (rosterUnsub) rosterUnsub();
      unsubscribeAuth();
    };
  }, [applyUnifiedUser]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      try {
        await signInWithEmailAndPassword(firebaseAuth, email.trim().toLowerCase(), password);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: mapFirebaseAuthError(err?.code) };
      }
    },
    [],
  );

  const signUp = useCallback(async (input: RegisterUserInput): Promise<AuthActionResult> => {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.displayName.trim();
    const shiftText = input.shift?.trim() || 'Turno Completo (08:00 - 20:00)';

    try {
      const cred = await createUserWithEmailAndPassword(
        firebaseAuth,
        cleanEmail,
        input.password,
      );

      await updateProfile(cred.user, { displayName: cleanName });

      const roleCode: UserRole = isDesignatedAdminAccount(cleanEmail, cred.user.uid)
        ? 'ADMIN'
        : 'RECEPTIONIST';
      const roleFields = buildUnifiedRoleFields(roleCode, shiftText);
      const now = new Date().toISOString();

      const profileDoc = {
        displayName: cleanName,
        email: cleanEmail,
        role: roleFields.role,
        roleLabel: roleFields.roleLabel,
        title: roleFields.title,
        clinicName: roleFields.clinicName,
        cmpv: roleFields.cmpv,
        shift: roleFields.shift,
        createdAt: now,
        updatedAt: now,
      };

      const newUser: User = {
        id: cred.user.uid,
        userName: cleanEmail,
        email: cleanEmail,
        displayName: cleanName,
        role: roleFields.role,
        roleLabel: roleFields.roleLabel,
        title: roleFields.title,
        clinicName: roleFields.clinicName,
        cmpv: roleFields.cmpv,
        shift: roleFields.shift,
        createdAt: now,
      };

      applyUnifiedUser(newUser);

      try {
        await setDoc(doc(firestoreDb, 'users', cred.user.uid), profileDoc);
      } catch {
        // Keep registration working if Firestore write hits temporary offline state
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err?.code) };
    }
  }, [applyUnifiedUser]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
    setSession(null);
    setStaffList([]);
  }, []);

  const isAdmin = Boolean(session && session.roleCode === 'ADMIN');

  const value = useMemo<AuthContextValue>(
    () => ({ session, initializing, isAdmin, staffList, signIn, signUp, signOut }),
    [session, initializing, isAdmin, staffList, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
