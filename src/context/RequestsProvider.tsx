import React, { ReactNode, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import {
  RequestChanges,
  RequestInput,
  RequestStatus,
  ServicePrices,
  ServiceType,
  VeterinaryRequest,
} from '../models/request';
import { requestRepository } from '../infrastructure/repositories/InMemoryRequestRepository';
import { actions } from '../store/actions';
import { initialState } from '../store/initialState';
import { requestsReducer } from '../store/requestsReducer';
import { generateId } from '../utils/id';
import { normalizePhone } from '../utils/validation';
import { RequestsContext, RequestsContextValue } from './RequestsContext';

function sanitize<T extends Partial<RequestInput>>(input: T): T {
  const out = { ...input };
  if (out.clienteNombre !== undefined) out.clienteNombre = out.clienteNombre.trim().replace(/\s+/g, ' ');
  if (out.mascotaNombre !== undefined) out.mascotaNombre = out.mascotaNombre.trim().replace(/\s+/g, ' ');
  if (out.descripcion !== undefined) out.descripcion = out.descripcion.trim();
  if (out.telefono !== undefined) {
    const digits = normalizePhone(out.telefono);

    out.telefono = /^9\d{8}$/.test(digits)
      ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      : digits;
  }
  return out;
}

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(requestsReducer, initialState, (init) => ({
    ...init,
    requests: requestRepository.getAllSync(),
  }));
  const [servicePrices, setServicePrices] = useState<ServicePrices>(() =>
    requestRepository.getServicePrices()
  );

  useEffect(() => {
    requestRepository.saveAllSync(state.requests);
  }, [state.requests]);

  const getRequestById = useCallback(
    (id: string) => state.requests.find((r) => r.id === id),
    [state.requests],
  );

  const createRequest = useCallback((input: RequestInput) => {
    const sanitized = sanitize(input);
    const request: VeterinaryRequest = {
      ...sanitized,
      id: generateId(),
      estado: 'PENDIENTE',
      fechaRegistro: sanitized.fechaRegistro ?? new Date().toISOString(),
    };
    dispatch(actions.create(request));
    return request;
  }, []);

  const updateRequest = useCallback((id: string, changes: RequestChanges) => {
    dispatch(actions.update(id, sanitize(changes)));
  }, []);

  const changeStatus = useCallback((id: string, status: RequestStatus) => {
    dispatch(actions.changeStatus(id, status));
  }, []);

  const deleteRequest = useCallback((id: string) => dispatch(actions.remove(id)), []);
  const clearAll = useCallback(() => dispatch(actions.clearAll()), []);
  const resetDemo = useCallback(() => dispatch(actions.clearAll()), []);

  const updateServicePrice = useCallback((service: ServiceType, price: number) => {
    const next = requestRepository.updateServicePrice(service, price);
    setServicePrices(next);
  }, []);

  const value = useMemo<RequestsContextValue>(
    () => ({
      requests: state.requests,
      loading: state.loading,
      servicePrices,
      getRequestById,
      createRequest,
      updateRequest,
      changeStatus,
      deleteRequest,
      updateServicePrice,
      resetDemo,
      clearAll,
    }),
    [
      state,
      servicePrices,
      getRequestById,
      createRequest,
      updateRequest,
      changeStatus,
      deleteRequest,
      updateServicePrice,
      resetDemo,
      clearAll,
    ],
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}
