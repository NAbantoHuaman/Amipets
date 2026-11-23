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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  CLINIC_NAME,
  fullName,
  mapFirebaseAuthError,
  ROLE_CONFIGS,
  shortGreetingName,
} from '../../application/services/authService';
import { RegisterUserInput, Session, User, UserRole } from '../../domain/models/user';
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

function buildFallbackSession(fbUser: FirebaseUser): Session {
  const email = (fbUser.email ?? '').trim().toLowerCase();
  const isEmailAdmin = email.startsWith('admin@');
  const roleCode: UserRole = isEmailAdmin ? 'ADMIN' : 'RECEPTIONIST';
  const cfg = ROLE_CONFIGS[roleCode];
  const fallbackName =
    fbUser.displayName?.trim() ||
    (isEmailAdmin ? 'Carlos Mendoza' : email.split('@')[0] || 'Colaborador');

  return {
    uid: fbUser.uid,
    email,
    userName: email,
    displayName: fallbackName,
    title: cfg.defaultTitle,
    clinicName: CLINIC_NAME,
    role: cfg.defaultRoleDescription,
    roleCode,
    cmpv: isEmailAdmin ? 'C.M.V.P. 8421 · Dirección Médica' : 'Recepción & Ventas',
    shift: 'Turno Completo (08:00 - 20:00)',
  };
}

function sessionToStaffUser(s: Session): User {
  return {
    id: s.uid,
    userName: s.email || s.userName,
    email: s.email,
    displayName: s.displayName,
    role: s.roleCode ?? 'RECEPTIONIST',
    roleLabel: s.role ?? ROLE_CONFIGS.RECEPTIONIST.defaultRoleDescription,
    title: s.title,
    clinicName: s.clinicName,
    cmpv: s.cmpv,
    shift: s.shift,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [staffList, setStaffList] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!fbUser) {
        setSession(null);
        setStaffList([]);
        setInitializing(false);
        return;
      }

      const base = buildFallbackSession(fbUser);
      setSession(base);
      setStaffList([sessionToStaffUser(base)]);
      setInitializing(false);

      try {
        const snap = await getDoc(doc(firestoreDb, 'users', fbUser.uid));
        if (snap.exists()) {
          const data = snap.data() as Record<string, any>;
          const roleCode: UserRole =
            data.role === 'ADMIN' || data.role === 'RECEPTIONIST'
              ? data.role
              : base.roleCode ?? 'RECEPTIONIST';
          const cfg = ROLE_CONFIGS[roleCode];

          const enriched: Session = {
            uid: fbUser.uid,
            email: typeof data.email === 'string' && data.email ? data.email : base.email,
            userName: typeof data.email === 'string' && data.email ? data.email : base.email,
            displayName:
              typeof data.displayName === 'string' && data.displayName
                ? data.displayName
                : base.displayName,
            title: typeof data.title === 'string' && data.title ? data.title : cfg.defaultTitle,
            clinicName:
              typeof data.clinicName === 'string' && data.clinicName
                ? data.clinicName
                : CLINIC_NAME,
            role:
              typeof data.roleLabel === 'string' && data.roleLabel
                ? data.roleLabel
                : cfg.defaultRoleDescription,
            roleCode,
            cmpv: typeof data.cmpv === 'string' ? data.cmpv : base.cmpv,
            shift: typeof data.shift === 'string' ? data.shift : base.shift,
          };
          setSession(enriched);
          setStaffList([sessionToStaffUser(enriched)]);
        }
      } catch {
        // Offline or unreachable Firestore: keep fallback session smoothly
      }
    });

    return unsubscribe;
  }, []);

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
    const cfg = ROLE_CONFIGS.RECEPTIONIST;

    try {
      const cred = await createUserWithEmailAndPassword(
        firebaseAuth,
        cleanEmail,
        input.password,
      );

      await updateProfile(cred.user, { displayName: cleanName });

      const profileDoc = {
        displayName: cleanName,
        email: cleanEmail,
        role: 'RECEPTIONIST',
        roleLabel: cfg.defaultRoleDescription,
        title: cfg.defaultTitle,
        clinicName: CLINIC_NAME,
        cmpv: `Recepción · ${shiftText}`,
        shift: shiftText,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(firestoreDb, 'users', cred.user.uid), profileDoc);
      } catch {
        // Keep registration working if Firestore write hits temporary offline state
      }

      const nextSession: Session = {
        uid: cred.user.uid,
        email: cleanEmail,
        userName: cleanEmail,
        displayName: cleanName,
        title: profileDoc.title,
        clinicName: profileDoc.clinicName,
        role: profileDoc.roleLabel,
        roleCode: 'RECEPTIONIST',
        cmpv: profileDoc.cmpv,
        shift: profileDoc.shift,
      };
      setSession(nextSession);
      setStaffList([sessionToStaffUser(nextSession)]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err?.code) };
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
    setSession(null);
    setStaffList([]);
  }, []);

  const isAdmin = Boolean(
    session &&
      (session.roleCode === 'ADMIN' || session.email.toLowerCase().startsWith('admin@')),
  );

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
