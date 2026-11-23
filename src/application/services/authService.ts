import { RegisterUserInput, Session, User, UserRole } from '../../domain/models/user';

export const CLINIC_NAME = 'Clínica Veterinaria Amipets';

export interface RoleConfig {
  role: UserRole;
  label: string;
  defaultTitle: string;
  defaultRoleDescription: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  ADMIN: {
    role: 'ADMIN',
    label: 'Director Médico / Admin',
    defaultTitle: 'Dr.',
    defaultRoleDescription: 'Director Médico & Fundador',
  },
  VETERINARIAN: {
    role: 'VETERINARIAN',
    label: 'Médico Veterinario',
    defaultTitle: 'Dr(a).',
    defaultRoleDescription: 'Médico Veterinario Asistencial',
  },
  RECEPTIONIST: {
    role: 'RECEPTIONIST',
    label: 'Recepcionista',
    defaultTitle: 'Recep.',
    defaultRoleDescription: 'Recepcionista · Admisión & Agenda',
  },
  ASSISTANT: {
    role: 'ASSISTANT',
    label: 'Asistente Veterinario',
    defaultTitle: 'Asist.',
    defaultRoleDescription: 'Asistente Clínico & Triaje',
  },
};

export function validateRegistrationInput(input: Partial<RegisterUserInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const name = (input.displayName ?? '').trim();
  if (!name) {
    errors.displayName = 'Ingresa tu nombre completo.';
  } else if (name.length < 3) {
    errors.displayName = 'El nombre debe tener al menos 3 caracteres.';
  } else if (name.length > 80) {
    errors.displayName = 'Máximo 80 caracteres.';
  }

  const email = (input.email ?? '').trim().toLowerCase();
  if (!email) {
    errors.email = 'Ingresa un correo electrónico.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  const pass = input.password ?? '';
  if (!pass) {
    errors.password = 'Ingresa una contraseña.';
  } else if (pass.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function mapFirebaseAuthError(code?: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Ingresa un correo electrónico válido.';
    case 'auth/network-request-failed':
      return 'Sin conexión a internet. Verifica tu red e intenta nuevamente.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento antes de volver a intentar.';
    case 'auth/operation-not-allowed':
      return 'El acceso con correo y contraseña no está habilitado.';
    default:
      return 'No se pudo completar la autenticación. Intenta nuevamente.';
  }
}

export function buildSessionFromUser(user: User): Session {
  return {
    uid: user.id,
    email: user.email ?? user.userName,
    userName: user.userName,
    displayName: user.displayName,
    title: user.title,
    clinicName: user.clinicName,
    role: user.roleLabel,
    roleCode: user.role,
    cmpv: user.cmpv,
    shift: user.shift,
  };
}

export function shortGreetingName(session: Session | null): string {
  if (!session) return '';
  const cleanEmail = (session.email || '').toLowerCase();
  if (session.roleCode === 'ADMIN' || cleanEmail.startsWith('admin@') || session.userName === 'admin') {
    const first = session.displayName.split(' ')[0] || 'Carlos';
    return session.title ? `${session.title} ${first}` : first;
  }
  const first = session.displayName.split(' ')[0];
  return session.title ? `${session.title} ${first}` : first;
}

export function fullName(session: Session | null): string {
  if (!session) return '';
  return session.title ? `${session.title} ${session.displayName}` : session.displayName;
}
