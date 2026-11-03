export type RequestStatus = 'PENDIENTE' | 'EN_ATENCION' | 'FINALIZADO';

export type Priority = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type ServiceType = 'CONSULTA' | 'VACUNACION' | 'EMERGENCIA' | 'GROOMING';

export type Species = 'PERRO' | 'GATO' | 'CONEJO' | 'OTRO';

export type ServicePrices = Record<ServiceType, number>;

export const DEFAULT_SERVICE_PRICES: ServicePrices = {
  CONSULTA: 50.0,
  VACUNACION: 45.0,
  EMERGENCIA: 90.0,
  GROOMING: 40.0,
};

export interface VeterinaryRequest {
  id: string;
  clienteNombre: string;
  telefono: string;
  mascotaNombre: string;
  especie?: Species;
  tipoServicio: ServiceType;
  prioridad: Priority;
  descripcion: string;
  estado: RequestStatus;
  fechaRegistro: string;
  registradoPor?: string;
  registradoPorUsuario?: string;
}

export type RequestInput = Pick<
  VeterinaryRequest,
  'clienteNombre' | 'telefono' | 'mascotaNombre' | 'especie' | 'tipoServicio' | 'prioridad' | 'descripcion'
> & {
  fechaRegistro?: string;
  registradoPor?: string;
  registradoPorUsuario?: string;
};

export type RequestChanges = Partial<RequestInput>;

export const REQUEST_STATUSES: RequestStatus[] = ['PENDIENTE', 'EN_ATENCION', 'FINALIZADO'];
export const PRIORITIES: Priority[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'];
export const SERVICE_TYPES: ServiceType[] = ['CONSULTA', 'VACUNACION', 'EMERGENCIA', 'GROOMING'];
export const SPECIES: Species[] = ['PERRO', 'GATO', 'CONEJO', 'OTRO'];
