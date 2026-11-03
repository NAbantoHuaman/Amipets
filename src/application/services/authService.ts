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
    errors.displayName = 'Ingresa el nombre y apellidos del recepcionista.';
  } else if (name.length < 3) {
    errors.displayName = 'El nombre debe tener al menos 3 caracteres.';
  }

  const user = (input.userName ?? '').trim().toLowerCase();
  if (!user) {
    errors.userName = 'Ingresa un nombre de usuario.';
  } else if (user === 'admin') {
    errors.userName = 'El usuario "admin" está reservado para el Director Médico.';
  } else if (user.length < 3) {
    errors.userName = 'El usuario debe tener al menos 3 caracteres.';
  } else if (!/^[a-zA-Z0-9._-]+$/.test(user)) {
    errors.userName = 'Solo letras, números, puntos o guiones.';
  }

  const pass = input.password ?? '';
  if (!pass) {
    errors.password = 'Ingresa una contraseña.';
  } else if (pass.length < 4) {
    errors.password = 'La contraseña debe tener al menos 4 caracteres.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildSessionFromUser(user: User): Session {
  return {
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
