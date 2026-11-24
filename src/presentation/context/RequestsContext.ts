import { createContext, useContext } from 'react';
import {
  RequestChanges,
  RequestInput,
  RequestStatus,
  ServicePrices,
  ServiceType,
  UserNotificationPrefs,
  VeterinaryRequest,
} from '../../domain/models/request';

export interface RequestsContextValue {
  requests: VeterinaryRequest[];
  loading: boolean;
  isOnline: boolean;
  syncing: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  servicePrices: ServicePrices;
  prefs: UserNotificationPrefs;
  readIds: Record<string, boolean>;
  refreshRequests: () => Promise<void>;
  syncRequestsNow: (silent?: boolean) => Promise<void>;
  getRequestById: (id: string) => VeterinaryRequest | undefined;
  createRequest: (input: RequestInput) => VeterinaryRequest;
  updateRequest: (id: string, changes: RequestChanges) => void;
  changeStatus: (id: string, status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  updateServicePrice: (service: ServiceType, price: number) => void;
  updatePref: (key: keyof UserNotificationPrefs, value: boolean) => void;
  toggleNotificationRead: (id: string) => void;
  markNotificationsRead: (ids: string[]) => void;
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
