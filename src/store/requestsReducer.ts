import { ActionTypes, RequestsAction } from './actions';
import { RequestsState } from './initialState';

/**
 * Reducer puro: toda modificación de solicitudes pasa por aquí.
 * Cada acción que afecta un registro compara por `id`, así una edición
 * nunca modifica una solicitud distinta por error.
 */
export function requestsReducer(state: RequestsState, action: RequestsAction): RequestsState {
  switch (action.type) {
    case ActionTypes.LOAD:
      return { requests: action.payload, loading: false };

    case ActionTypes.CREATE:
      return { ...state, requests: [action.payload, ...state.requests] };

    case ActionTypes.UPDATE: {
      const { id, changes } = action.payload;
      return {
        ...state,
        requests: state.requests.map((r) =>
          // id y fechaRegistro se preservan siempre.
          r.id === id ? { ...r, ...changes, id: r.id, fechaRegistro: r.fechaRegistro } : r,
        ),
      };
    }

    case ActionTypes.CHANGE_STATUS: {
      const { id, status } = action.payload;
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === id ? { ...r, estado: status } : r)),
      };
    }

    case ActionTypes.DELETE:
      return { ...state, requests: state.requests.filter((r) => r.id !== action.payload.id) };

    case ActionTypes.RESET_DEMO:
      return { requests: action.payload, loading: false };

    case ActionTypes.CLEAR_ALL:
      return { ...state, requests: [] };

    default:
      return state;
  }
}
