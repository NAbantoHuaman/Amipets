import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export interface Session {
  userName: string;

  displayName: string;

  title: string;
  clinicName: string;

  role?: string;

  cmpv?: string;
}

interface AuthContextValue {
  session: Session | null;

  signIn: (userName: string, password: string) => boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const CLINIC_NAME = 'Clínica Veterinaria Amipets';

export const ADMIN_USER = 'admin';
export const ADMIN_PASS = 'admin';

export const DOCTOR_DIRECTOR_PROFILE: Session = {
  userName: 'admin',
  displayName: 'Carlos Mendoza',
  title: 'Dr.',
  clinicName: CLINIC_NAME,
  role: 'Director Médico & Fundador',
  cmpv: 'C.M.V.P. 8421 · Cirugía & Traumatología',
};

function formatDisplayName(user: string): string {
  const parts = user.split(/[._\s-]+/).filter(Boolean);
  if (parts.length === 0) return 'Personal Clínico';
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const signIn = useCallback((userName: string, password: string) => {
    const rawUser = userName.trim().toLowerCase();
    const rawPass = password.trim().toLowerCase();

    if (rawUser === ADMIN_USER || rawUser === 'carlos' || rawUser === 'carlos.mendoza') {
      if (rawPass.length >= 4) {
        setSession({ ...DOCTOR_DIRECTOR_PROFILE });
        return true;
      }
    }

    if (rawUser.length >= 3 && rawPass.length >= 4) {
      setSession({
        userName: rawUser,
        displayName: formatDisplayName(userName.trim()),
        title: 'Dr(a).',
        clinicName: CLINIC_NAME,
        role: 'Médico Veterinario Asistencial',
        cmpv: 'C.M.V.P. Colegiado',
      });
      return true;
    }

    return false;
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}

export function shortGreetingName(session: Session | null): string {
  if (!session) return '';
  if (session.userName === 'admin' || session.displayName.toLowerCase() === 'admin') {
    return 'Dr. Carlos';
  }
  const first = session.displayName.split(' ')[0];
  return session.title ? `${session.title} ${first}` : first;
}

export function fullName(session: Session | null): string {
  if (!session) return '';
  if (session.userName === 'admin' || session.displayName.toLowerCase() === 'admin') {
    return 'Dr. Carlos Mendoza';
  }
  return session.title ? `${session.title} ${session.displayName}` : session.displayName;
}
