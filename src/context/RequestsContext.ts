import { createContext, useContext } from 'react';
import {
  RequestChanges,
  RequestInput,
  RequestStatus,
  ServicePrices,
  ServiceType,
  VeterinaryRequest,
} from '../models/request';

export interface RequestsContextValue {
  requests: VeterinaryRequest[];
  loading: boolean;
  servicePrices: ServicePrices;
  getRequestById: (id: string) => VeterinaryRequest | undefined;
  createRequest: (input: RequestInput) => VeterinaryRequest;
  updateRequest: (id: string, changes: RequestChanges) => void;
  changeStatus: (id: string, status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  updateServicePrice: (service: ServiceType, price: number) => void;
  resetDemo: () => void;
  clearAll: () => void;
}

export const RequestsContext = createContext<RequestsContextValue | null>(null);

export function useRequests(): RequestsContextValue {
  const ctx = useContext(RequestsContext);
  if (!ctx) {
    throw new Error('useRequests debe usarse dentro de <RequestsProvider>.');
  }
  return ctx;
}
