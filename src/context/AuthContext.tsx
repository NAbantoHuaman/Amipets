import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export interface Session {
  userName: string;
  /** Nombre completo del médico o profesional clínico. */
  displayName: string;
  /** Tratamiento profesional, ej. "Dr." o "Dra.". */
  title: string;
  clinicName: string;
  /** Cargo asistencial o directivo */
  role?: string;
  /** Colegiatura profesional */
  cmpv?: string;
}

interface AuthContextValue {
  session: Session | null;
  /** Valida y autentica al usuario ingresado. */
  signIn: (userName: string, password: string) => boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const CLINIC_NAME = 'Clínica Veterinaria Amipets';

/** Credenciales de acceso oficial */
export const ADMIN_USER = 'admin';
export const ADMIN_PASS = 'admin';

/** Perfil oficial del Doctor Director / Dueño de Amipets */
export const DOCTOR_DIRECTOR_PROFILE: Session = {
  userName: 'admin',
  displayName: 'Carlos Mendoza',
  title: 'Dr.',
  clinicName: CLINIC_NAME,
  role: 'Director Médico & Fundador',
  cmpv: 'C.M.V.P. 8421 · Cirugía & Traumatología',
};

/** Formatea nombres de usuario como "ana.torres" a "Ana Torres". */
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

    // Cuenta admin / admin (o cualquier variante de mayúsculas/espacios):
    // Accede directamente con el perfil del Dr. Carlos Mendoza (Director Médico y Dueño).
    if (rawUser === ADMIN_USER || rawUser === 'carlos' || rawUser === 'carlos.mendoza') {
      if (rawPass.length >= 4) {
        setSession({ ...DOCTOR_DIRECTOR_PROFILE });
        return true;
      }
    }

    // Acceso alternativo para otro médico o asistente
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

/** Saludo profesional corto, ej: "Dr. Carlos" o "Dra. Ana". */
export function shortGreetingName(session: Session | null): string {
  if (!session) return '';
  if (session.userName === 'admin' || session.displayName.toLowerCase() === 'admin') {
    return 'Dr. Carlos';
  }
  const first = session.displayName.split(' ')[0];
  return session.title ? `${session.title} ${first}` : first;
}

/** Nombre completo, ej: "Dr. Carlos Mendoza". */
export function fullName(session: Session | null): string {
  if (!session) return '';
  if (session.userName === 'admin' || session.displayName.toLowerCase() === 'admin') {
    return 'Dr. Carlos Mendoza';
  }
  return session.title ? `${session.title} ${session.displayName}` : session.displayName;
}
