import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { generateId } from '../../application/utils/id';
import {
  RequestChanges,
  RequestInput,
  RequestStatus,
  ServicePrices,
  ServiceType,
  VeterinaryRequest,
} from '../../domain/models/request';
import { requestRepository } from '../../infrastructure/repositories/InMemoryRequestRepository';
import { actions } from '../store/actions';
import { initialState } from '../store/initialState';
import { requestsReducer } from '../store/requestsReducer';
import { normalizePhone } from '../utils/validation';
import { RequestsContext, RequestsContextValue } from './RequestsContext';

function sanitize<T extends Partial<RequestInput>>(input: T): T {
  const out = { ...input };
  if (out.clienteNombre !== undefined) out.clienteNombre = out.clienteNombre.trim().replace(/\s+/g, ' ');
  if (out.mascotaNombre !== undefined) out.mascotaNombre = out.mascotaNombre.trim().replace(/\s+/g, ' ');
  if (out.raza !== undefined) out.raza = out.raza.trim().replace(/\s+/g, ' ') || undefined;
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
  const [state, dispatch] = useReducer(requestsReducer, initialState);
  const [servicePrices, setServicePrices] = useState<ServicePrices>(() =>
    requestRepository.getServicePrices(),
  );
  const hydratedRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      requestRepository.loadPersistedRequests(),
      requestRepository.loadPersistedServicePrices(),
    ]).then(([savedRequests, savedPrices]) => {
      if (!active) return;
      hydratedRef.current = true;
      dispatch(actions.load(savedRequests));
      setServicePrices(savedPrices);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void requestRepository.saveRequestsAsync(state.requests);
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
    void requestRepository.saveServicePricesAsync(next);
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
