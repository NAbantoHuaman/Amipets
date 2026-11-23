import { Species } from './request';

export type OrderStatus = 'PENDIENTE' | 'EN_PROCESO' | 'ENTREGADO' | 'CANCELADO';

export type OrderCategory = 'ALIMENTO' | 'ACCESORIOS' | 'ROPA' | 'JUGUETES';

export type SyncStatus = 'PENDING' | 'SYNCED';

export interface PetOrder {
  id: string;
  userId?: string;
  clienteNombre: string;
  telefono?: string;
  mascotaNombre?: string;
  especie?: Species;
  productoId?: number;
  marca?: string;
  sku?: string;
  categoria: OrderCategory;
  producto: string;
  cantidad: number;
  precio: number;
  notas?: string;
  estado: OrderStatus;
  fechaRegistro: string;
  registradoPor?: string;
  registradoPorUsuario?: string;
  syncStatus?: SyncStatus;
  syncedAt?: string;
  updatedAt?: string;
  comprobanteLocalUri?: string;
  comprobanteUrl?: string;
  deletedAt?: string;
}

export type OrderInput = Pick<
  PetOrder,
  | 'userId'
  | 'clienteNombre'
  | 'telefono'
  | 'mascotaNombre'
  | 'especie'
  | 'productoId'
  | 'marca'
  | 'sku'
  | 'categoria'
  | 'producto'
  | 'cantidad'
  | 'precio'
  | 'notas'
  | 'registradoPor'
  | 'registradoPorUsuario'
  | 'comprobanteLocalUri'
  | 'comprobanteUrl'
> & {
  estado?: OrderStatus;
  fechaRegistro?: string;
};

export type OrderChanges = Partial<Omit<PetOrder, 'id'>>;

export const ORDER_STATUSES: OrderStatus[] = ['PENDIENTE', 'EN_PROCESO', 'ENTREGADO', 'CANCELADO'];
export const ORDER_CATEGORIES: OrderCategory[] = ['ALIMENTO', 'ACCESORIOS', 'ROPA', 'JUGUETES'];
