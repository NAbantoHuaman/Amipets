/**
 * Modelo de datos de una solicitud de atención veterinaria.
 * Las propiedades obligatorias corresponden al modelo mínimo de la rúbrica;
 * `especie` es una extensión opcional para mostrar el avatar de la mascota.
 */

export type RequestStatus = 'PENDIENTE' | 'EN_ATENCION' | 'FINALIZADO';

export type Priority = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type ServiceType = 'CONSULTA' | 'VACUNACION' | 'EMERGENCIA' | 'GROOMING';

export type Species = 'PERRO' | 'GATO' | 'CONEJO' | 'OTRO';

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
  /** Fecha ISO 8601 generada automáticamente al crear. */
  fechaRegistro: string;
}

/** Datos que el usuario puede capturar en el formulario. */
export type RequestInput = Pick<
  VeterinaryRequest,
  'clienteNombre' | 'telefono' | 'mascotaNombre' | 'especie' | 'tipoServicio' | 'prioridad' | 'descripcion'
>;

/** Campos que se permiten modificar en una edición (nunca id ni fecha). */
export type RequestChanges = Partial<RequestInput>;

export const REQUEST_STATUSES: RequestStatus[] = ['PENDIENTE', 'EN_ATENCION', 'FINALIZADO'];
export const PRIORITIES: Priority[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'];
export const SERVICE_TYPES: ServiceType[] = ['CONSULTA', 'VACUNACION', 'EMERGENCIA', 'GROOMING'];
export const SPECIES: Species[] = ['PERRO', 'GATO', 'CONEJO', 'OTRO'];
