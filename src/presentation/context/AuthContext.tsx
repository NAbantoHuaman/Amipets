import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { RegisterUserInput, Session, User } from '../../domain/models/user';
import { fullName, shortGreetingName } from '../../application/services/authService';
import { authRepository, DEFAULT_ADMIN_USER } from '../../infrastructure/repositories/InMemoryAuthRepository';

export { shortGreetingName, fullName };
export type { Session, RegisterUserInput, User };

export interface AuthContextValue {
  session: Session | null;
  isAdmin: boolean;
  staffList: User[];
  signIn: (userName: string, password: string) => boolean;
  signUp: (input: RegisterUserInput) => { success: boolean; error?: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const CLINIC_NAME = 'Clínica Veterinaria Amipets';
export const ADMIN_USER = 'admin';
export const ADMIN_PASS = 'admin';

export const DOCTOR_DIRECTOR_PROFILE: Session = {
  userName: DEFAULT_ADMIN_USER.userName,
  displayName: DEFAULT_ADMIN_USER.displayName,
  title: DEFAULT_ADMIN_USER.title,
  clinicName: DEFAULT_ADMIN_USER.clinicName,
  role: DEFAULT_ADMIN_USER.roleLabel,
  roleCode: DEFAULT_ADMIN_USER.role,
  cmpv: DEFAULT_ADMIN_USER.cmpv,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => authRepository.getSavedSession());
  const [staffList, setStaffList] = useState<User[]>(() => authRepository.getAllUsersSync());

  const signIn = useCallback((userName: string, password: string) => {
    const res = authRepository.loginSync(userName, password);
    if (res) {
      setSession(res);
      setStaffList(authRepository.getAllUsersSync());
      return true;
    }
    return false;
  }, []);

  const signUp = useCallback((input: RegisterUserInput) => {
    try {
      const newSession = authRepository.registerSync(input);
      setSession(newSession);
      setStaffList(authRepository.getAllUsersSync());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al registrar recepcionista.' };
    }
  }, []);

  const signOut = useCallback(() => {
    authRepository.logoutSync();
    setSession(null);
  }, []);

  const isAdmin = Boolean(
    session && (session.userName.toLowerCase() === 'admin' || session.roleCode === 'ADMIN')
  );

  const value = useMemo(
    () => ({ session, isAdmin, staffList, signIn, signUp, signOut }),
    [session, isAdmin, staffList, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
