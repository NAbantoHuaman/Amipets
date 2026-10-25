import { createContext, useContext } from 'react';
import { RequestChanges, RequestInput, RequestStatus, VeterinaryRequest } from '../models/request';

export interface RequestsContextValue {
  requests: VeterinaryRequest[];
  loading: boolean;
  getRequestById: (id: string) => VeterinaryRequest | undefined;
  createRequest: (input: RequestInput) => VeterinaryRequest;
  updateRequest: (id: string, changes: RequestChanges) => void;
  changeStatus: (id: string, status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  resetDemo: () => void;
  clearAll: () => void;
}

export const RequestsContext = createContext<RequestsContextValue | null>(null);

/** Acceso tipado al estado compartido de solicitudes. */
export function useRequests(): RequestsContextValue {
  const ctx = useContext(RequestsContext);
  if (!ctx) {
    throw new Error('useRequests debe usarse dentro de <RequestsProvider>.');
  }
  return ctx;
}
