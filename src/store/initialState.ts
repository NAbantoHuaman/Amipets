import { VeterinaryRequest } from '../models/request';

export interface RequestsState {
  /** Única fuente de datos para todas las pantallas. */
  requests: VeterinaryRequest[];
  /** Indica si se está inicializando el estado de la aplicación. */
  loading: boolean;
}

/**
 * Estado inicial limpio: sin datos falsos ni solicitudes pre-cargadas.
 * Las solicitudes se registran en tiempo real por el personal de la clínica.
 */
export const initialState: RequestsState = {
  requests: [],
  loading: false,
};
