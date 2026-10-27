import { RequestChanges, RequestStatus, VeterinaryRequest } from '../models/request';

export const ActionTypes = {
  LOAD: 'LOAD',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  CHANGE_STATUS: 'CHANGE_STATUS',
  DELETE: 'DELETE',
  RESET_DEMO: 'RESET_DEMO',
  CLEAR_ALL: 'CLEAR_ALL',
} as const;

export type RequestsAction =
  | { type: typeof ActionTypes.LOAD; payload: VeterinaryRequest[] }
  | { type: typeof ActionTypes.CREATE; payload: VeterinaryRequest }
  | { type: typeof ActionTypes.UPDATE; payload: { id: string; changes: RequestChanges } }
  | { type: typeof ActionTypes.CHANGE_STATUS; payload: { id: string; status: RequestStatus } }
  | { type: typeof ActionTypes.DELETE; payload: { id: string } }
  | { type: typeof ActionTypes.RESET_DEMO; payload: VeterinaryRequest[] }
  | { type: typeof ActionTypes.CLEAR_ALL };

export const actions = {
  load: (payload: VeterinaryRequest[]): RequestsAction => ({ type: ActionTypes.LOAD, payload }),
  create: (payload: VeterinaryRequest): RequestsAction => ({ type: ActionTypes.CREATE, payload }),
  update: (id: string, changes: RequestChanges): RequestsAction => ({
    type: ActionTypes.UPDATE,
    payload: { id, changes },
  }),
  changeStatus: (id: string, status: RequestStatus): RequestsAction => ({
    type: ActionTypes.CHANGE_STATUS,
    payload: { id, status },
  }),
  remove: (id: string): RequestsAction => ({ type: ActionTypes.DELETE, payload: { id } }),
  resetDemo: (payload: VeterinaryRequest[]): RequestsAction => ({ type: ActionTypes.RESET_DEMO, payload }),
  clearAll: (): RequestsAction => ({ type: ActionTypes.CLEAR_ALL }),
};
