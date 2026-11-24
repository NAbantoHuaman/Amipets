import { SyncStatus } from './order';

export type RequestStatus = 'PENDIENTE' | 'EN_ATENCION' | 'FINALIZADO';

export type Priority = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type ServiceType = 'CONSULTA' | 'VACUNACION' | 'EMERGENCIA' | 'GROOMING';

export type Species = 'PERRO' | 'GATO' | 'CONEJO' | 'OTRO';

export type ServicePrices = Record<ServiceType, number>;

export interface UserNotificationPrefs {
  notifyUrgent: boolean;
  soundAlerts: boolean;
  vaccineReminders: boolean;
}

export interface UserAppSettings {
  userId: string;
  servicePrices: ServicePrices;
  prefs: UserNotificationPrefs;
  readIds: string[];
  syncStatus?: SyncStatus;
  syncedAt?: string;
  updatedAt: string;
}

export const DEFAULT_SERVICE_PRICES: ServicePrices = {
  CONSULTA: 50.0,
  VACUNACION: 45.0,
  EMERGENCIA: 90.0,
  GROOMING: 40.0,
};

export const DEFAULT_NOTIFICATION_PREFS: UserNotificationPrefs = {
  notifyUrgent: true,
  soundAlerts: true,
  vaccineReminders: true,
};

export interface VeterinaryRequest {
  id: string;
  userId?: string;
  clienteNombre: string;
  telefono: string;
  mascotaNombre: string;
  especie?: Species;
  raza?: string;
  tipoServicio: ServiceType;
  prioridad: Priority;
  descripcion: string;
  estado: RequestStatus;
  fechaRegistro: string;
  registradoPor?: string;
  registradoPorUsuario?: string;
  syncStatus?: SyncStatus;
  syncedAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export type RequestInput = Pick<
  VeterinaryRequest,
  | 'clienteNombre'
  | 'telefono'
  | 'mascotaNombre'
  | 'especie'
  | 'raza'
  | 'tipoServicio'
  | 'prioridad'
  | 'descripcion'
> & {
  id?: string;
  userId?: string;
  estado?: RequestStatus;
  fechaRegistro?: string;
  registradoPor?: string;
  registradoPorUsuario?: string;
};

export type RequestChanges = Partial<RequestInput> & {
  estado?: RequestStatus;
  syncStatus?: SyncStatus;
  syncedAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export const REQUEST_STATUSES: RequestStatus[] = ['PENDIENTE', 'EN_ATENCION', 'FINALIZADO'];
export const PRIORITIES: Priority[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'];
export const SERVICE_TYPES: ServiceType[] = ['CONSULTA', 'VACUNACION', 'EMERGENCIA', 'GROOMING'];
export const SPECIES: Species[] = ['PERRO', 'GATO', 'CONEJO', 'OTRO'];
