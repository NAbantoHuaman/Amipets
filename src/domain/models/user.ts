export type UserRole = 'ADMIN' | 'VETERINARIAN' | 'RECEPTIONIST' | 'ASSISTANT';

export interface User {
  id: string;
  userName: string;
  email?: string;
  password?: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  title: string;
  clinicName: string;
  cmpv?: string;
  shift?: string;
  createdAt: string;
}

export interface Session {
  uid: string;
  email: string;
  userName: string;
  displayName: string;
  title: string;
  clinicName: string;
  role?: string;
  roleCode?: UserRole;
  cmpv?: string;
  shift?: string;
}

export interface RegisterUserInput {
  email: string;
  userName?: string;
  password: string;
  displayName: string;
  role?: UserRole;
  cmpv?: string;
  shift?: string;
}
