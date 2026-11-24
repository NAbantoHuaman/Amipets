import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { fullName } from '../../application/services/authService';
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SERVICE_PRICES,
  RequestChanges,
  RequestInput,
  RequestStatus,
  ServicePrices,
  ServiceType,
  UserNotificationPrefs,
  VeterinaryRequest,
} from '../../domain/models/request';
import {
  generateRequestId,
  sqliteRequestRepository,
} from '../../infrastructure/repositories/SqliteRequestRepository';
import { sqliteSettingsRepository } from '../../infrastructure/repositories/SqliteSettingsRepository';
import {
  pushClinicPricesToFirestore,
  subscribeClinicPricesSnapshot,
  subscribeUserRequestsSnapshot,
  subscribeUserSettingsSnapshot,
  syncUserRequestsAndSettings,
} from '../../infrastructure/services/firebaseRequestSyncService';
import { actions } from '../store/actions';
import { initialState } from '../store/initialState';
import { requestsReducer } from '../store/requestsReducer';
import { normalizePhone } from '../utils/validation';
import { useAuth } from './AuthContext';
import { RequestsContext, RequestsContextValue } from './RequestsContext';
import { useToast } from './ToastContext';

function sanitize<T extends Partial<RequestInput>>(input: T): T {
  const out = { ...input };
  if (out.clienteNombre !== undefined) {
    out.clienteNombre = out.clienteNombre.trim().replace(/\s+/g, ' ');
  }
  if (out.mascotaNombre !== undefined) {
    out.mascotaNombre = out.mascotaNombre.trim().replace(/\s+/g, ' ');
  }
  if (out.raza !== undefined) {
    out.raza = out.raza.trim().replace(/\s+/g, ' ') || undefined;
  }
  if (out.descripcion !== undefined) {
    out.descripcion = out.descripcion.trim();
  }
  if (out.telefono !== undefined) {
    const digits = normalizePhone(out.telefono);
    out.telefono = /^9\d{8}$/.test(digits)
      ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      : digits;
  }
  return out;
}

function listToReadMap(ids: string[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const id of ids) {
    if (id) map[id] = true;
  }
  return map;
}

export function RequestsProvider({ children }: { children: ReactNode }) {
  const { session, isAdmin } = useAuth();
  const { showToast } = useToast();
  const userId = session?.uid;

  const [state, dispatch] = useReducer(requestsReducer, initialState);
  const [servicePrices, setServicePrices] = useState<ServicePrices>({ ...DEFAULT_SERVICE_PRICES });
  const [prefs, setPrefs] = useState<UserNotificationPrefs>({ ...DEFAULT_NOTIFICATION_PREFS });
  const [readIdsList, setReadIdsList] = useState<string[]>([]);

  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const syncingRef = useRef(false);
  const resyncQueuedRef = useRef(false);
  const isOnlineRef = useRef(true);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;

  const pricesRef = useRef(servicePrices);
  pricesRef.current = servicePrices;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const readIdsRef = useRef(readIdsList);
  readIdsRef.current = readIdsList;

  const loadLocalAll = useCallback(async (uid?: string) => {
    if (!uid) {
      dispatch(actions.load([]));
      setServicePrices({ ...DEFAULT_SERVICE_PRICES });
      setPrefs({ ...DEFAULT_NOTIFICATION_PREFS });
      setReadIdsList([]);
      setPendingSyncCount(0);
      return;
    }

    try {
      await Promise.all([
        sqliteRequestRepository.migrateLegacyAsyncStorage(
          uid,
          fullName(sessionRef.current) || undefined,
          sessionRef.current?.email,
        ),
        sqliteSettingsRepository.migrateLegacyAsyncStorage(uid),
      ]);

      const [savedRequests, pendingReqs, savedSettings] = await Promise.all([
        sqliteRequestRepository.getAll(uid),
        sqliteRequestRepository.getPendingSync(uid),
        sqliteSettingsRepository.getOrCreate(uid),
      ]);

      dispatch(actions.load(savedRequests));
      setServicePrices(savedSettings.servicePrices);
      setPrefs(savedSettings.prefs);
      setReadIdsList(savedSettings.readIds);
      const settingsPending = savedSettings.syncStatus === 'PENDING' ? 1 : 0;
      setPendingSyncCount(pendingReqs.length + settingsPending);
    } catch {
      dispatch(actions.load([]));
    }
  }, []);

  const syncRequestsNow = useCallback(
    async (silent = true) => {
      const uid = sessionRef.current?.uid;
      if (!uid) return;
      if (syncingRef.current) {
        resyncQueuedRef.current = true;
        return;
      }

      if (!isOnlineRef.current) {
        if (!silent) {
          showToast(
            'info',
            'Sin conexión',
            'Las solicitudes y ajustes quedan guardados en el dispositivo y se enviarán al volver la red.',
          );
        }
        return;
      }

      syncingRef.current = true;
      setSyncing(true);
      try {
        const result = await syncUserRequestsAndSettings(
          uid,
          isAdminRef.current,
          fullName(sessionRef.current) || sessionRef.current?.email,
        );
        await loadLocalAll(uid);
        setLastSyncedAt(new Date().toISOString());

        const sentCount = result.pushed + result.deleted + (result.settingsSynced ? 1 : 0);
        if (!silent) {
          if (result.failed > 0 && sentCount === 0) {
            showToast(
              'error',
              'Error de sincronización',
              'No se pudieron sincronizar las solicitudes pendientes.',
            );
          } else if (sentCount > 0) {
            showToast(
              'success',
              'Clínica sincronizada',
              'Solicitudes y preferencias respaldadas correctamente.',
            );
          } else {
            showToast('info', 'Todo al día', 'Solicitudes y ajustes ya están sincronizados.');
          }
        }
      } catch {
        if (!silent) {
          showToast(
            'error',
            'Error de sincronización',
            'No se pudo completar la sincronización clínica.',
          );
        }
      } finally {
        syncingRef.current = false;
        setSyncing(false);
        if (resyncQueuedRef.current && isOnlineRef.current && sessionRef.current?.uid) {
          resyncQueuedRef.current = false;
          setTimeout(() => {
            void syncRequestsNow(true);
          }, 60);
        }
      }
    },
    [loadLocalAll, showToast],
  );

  const refreshRequests = useCallback(async () => {
    await loadLocalAll(sessionRef.current?.uid);
  }, [loadLocalAll]);

  useEffect(() => {
    setLastSyncedAt(null);
    loadLocalAll(userId).then(() => {
      if (userId && isOnlineRef.current) {
        void syncRequestsNow(true);
      }
    });

    if (!userId) return;

    const unsubReqs = subscribeUserRequestsSnapshot(userId, (remoteRequests) => {
      if (syncingRef.current) return;
      sqliteRequestRepository
        .reconcileRemoteSnapshot(userId, remoteRequests)
        .then(() => loadLocalAll(userId))
        .catch(() => {});
    });

    const unsubSettings = subscribeUserSettingsSnapshot(userId, (remoteSettings) => {
      if (syncingRef.current) return;
      sqliteSettingsRepository
        .upsertFromRemote({
          ...remoteSettings,
          servicePrices: pricesRef.current,
        })
        .then((merged) => {
          setPrefs(merged.prefs);
          setReadIdsList(merged.readIds);
        })
        .catch(() => {});
    });

    const unsubClinicPrices = subscribeClinicPricesSnapshot((remotePrices) => {
      setServicePrices(remotePrices);
      sqliteSettingsRepository
        .upsertFromRemote({
          userId,
          servicePrices: remotePrices,
          prefs: prefsRef.current,
          readIds: readIdsRef.current,
          updatedAt: new Date().toISOString(),
        })
        .catch(() => {});
    });

    return () => {
      unsubReqs();
      unsubSettings();
      unsubClinicPrices();
    };
  }, [userId, loadLocalAll, syncRequestsNow]);

  useEffect(() => {
    let mounted = true;

    NetInfo.fetch()
      .then((netState) => {
        if (!mounted) return;
        const online = Boolean(netState.isConnected && netState.isInternetReachable !== false);
        isOnlineRef.current = online;
        setIsOnline(online);
        if (online && sessionRef.current?.uid) {
          void syncRequestsNow(true);
        }
      })
      .catch(() => {});

    const unsubscribe = NetInfo.addEventListener((netState) => {
      const online = Boolean(netState.isConnected && netState.isInternetReachable !== false);
      const prevOnline = isOnlineRef.current;
      isOnlineRef.current = online;
      setIsOnline(online);

      if (online && !prevOnline && sessionRef.current?.uid) {
        void syncRequestsNow(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [syncRequestsNow]);

  const getRequestById = useCallback(
    (id: string) => state.requests.find((r) => r.id === id),
    [state.requests],
  );

  const createRequest = useCallback(
    (input: RequestInput) => {
      const activeSession = sessionRef.current;
      const sanitized = sanitize(input);
      const now = new Date().toISOString();
      const id = sanitized.id ?? generateRequestId();
      const request: VeterinaryRequest = {
        ...sanitized,
        id,
        userId: sanitized.userId ?? activeSession?.uid,
        estado: sanitized.estado ?? 'PENDIENTE',
        fechaRegistro: sanitized.fechaRegistro ?? now,
        registradoPor: sanitized.registradoPor ?? (fullName(activeSession) || undefined),
        registradoPorUsuario: sanitized.registradoPorUsuario ?? activeSession?.email,
        syncStatus: 'PENDING',
        updatedAt: now,
      };

      dispatch(actions.create(request));
      setPendingSyncCount((c) => c + 1);

      sqliteRequestRepository
        .create(request)
        .then(() => {
          if (isOnlineRef.current && request.userId) {
            void syncRequestsNow(true);
          }
        })
        .catch(() => {});

      return request;
    },
    [syncRequestsNow],
  );

  const updateRequest = useCallback(
    (id: string, changes: RequestChanges) => {
      const sanitized = sanitize(changes);
      const now = new Date().toISOString();
      dispatch(
        actions.update(id, {
          ...sanitized,
          syncStatus: 'PENDING',
          updatedAt: now,
        }),
      );

      sqliteRequestRepository
        .update(id, sanitized)
        .then(async () => {
          const uid = sessionRef.current?.uid;
          if (uid) {
            const pending = await sqliteRequestRepository.getPendingSync(uid);
            setPendingSyncCount(pending.length);
            if (isOnlineRef.current) {
              void syncRequestsNow(true);
            }
          }
        })
        .catch(() => {});
    },
    [syncRequestsNow],
  );

  const changeStatus = useCallback(
    (id: string, status: RequestStatus) => {
      const now = new Date().toISOString();
      dispatch(actions.changeStatus(id, status));
      dispatch(actions.update(id, { syncStatus: 'PENDING', updatedAt: now }));

      sqliteRequestRepository
        .changeStatus(id, status)
        .then(async () => {
          const uid = sessionRef.current?.uid;
          if (uid) {
            const pending = await sqliteRequestRepository.getPendingSync(uid);
            setPendingSyncCount(pending.length);
            if (isOnlineRef.current) {
              void syncRequestsNow(true);
            }
          }
        })
        .catch(() => {});
    },
    [syncRequestsNow],
  );

  const deleteRequest = useCallback(
    (id: string) => {
      dispatch(actions.remove(id));
      sqliteRequestRepository
        .delete(id)
        .then(async () => {
          const uid = sessionRef.current?.uid;
          if (uid) {
            const pending = await sqliteRequestRepository.getPendingSync(uid);
            setPendingSyncCount(pending.length);
            if (isOnlineRef.current) {
              void syncRequestsNow(true);
            }
          }
        })
        .catch(() => {});
    },
    [syncRequestsNow],
  );

  const clearAll = useCallback(() => {
    const uid = sessionRef.current?.uid;
    dispatch(actions.clearAll());
    if (!uid) return;

    sqliteRequestRepository
      .getAll(uid)
      .then(async (list) => {
        for (const req of list) {
          await sqliteRequestRepository.delete(req.id);
        }
        const pending = await sqliteRequestRepository.getPendingSync(uid);
        setPendingSyncCount(pending.length);
        if (isOnlineRef.current) {
          void syncRequestsNow(true);
        }
      })
      .catch(() => {});
  }, [syncRequestsNow]);

  const resetDemo = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const persistSettings = useCallback(
    (
      nextPrices: ServicePrices,
      nextPrefs: UserNotificationPrefs,
      nextReadIds: string[],
    ) => {
      const uid = sessionRef.current?.uid;
      if (!uid) return;

      sqliteSettingsRepository
        .saveLocal({
          userId: uid,
          servicePrices: nextPrices,
          prefs: nextPrefs,
          readIds: nextReadIds,
        })
        .then(() => {
          setPendingSyncCount((c) => c + 1);
          if (isOnlineRef.current) {
            void syncRequestsNow(true);
          }
        })
        .catch(() => {});
    },
    [syncRequestsNow],
  );

  const updateServicePrice = useCallback(
    (service: ServiceType, price: number) => {
      const nextPrices: ServicePrices = {
        ...pricesRef.current,
        [service]: price,
      };
      setServicePrices(nextPrices);
      persistSettings(nextPrices, prefsRef.current, readIdsRef.current);
      if (isAdminRef.current && isOnlineRef.current) {
        void pushClinicPricesToFirestore(
          nextPrices,
          fullName(sessionRef.current) || sessionRef.current?.email,
        ).catch(() => {});
      }
    },
    [persistSettings],
  );

  const updatePref = useCallback(
    (key: keyof UserNotificationPrefs, value: boolean) => {
      const nextPrefs: UserNotificationPrefs = {
        ...prefsRef.current,
        [key]: value,
      };
      setPrefs(nextPrefs);
      persistSettings(pricesRef.current, nextPrefs, readIdsRef.current);
    },
    [persistSettings],
  );

  const toggleNotificationRead = useCallback(
    (id: string) => {
      if (!id) return;
      const current = readIdsRef.current;
      const exists = current.includes(id);
      const next = exists ? current.filter((x) => x !== id) : [...current, id].slice(-250);
      setReadIdsList(next);
      persistSettings(pricesRef.current, prefsRef.current, next);
    },
    [persistSettings],
  );

  const markNotificationsRead = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const merged = Array.from(new Set([...readIdsRef.current, ...ids])).slice(-250);
      if (merged.length === readIdsRef.current.length) return;
      setReadIdsList(merged);
      persistSettings(pricesRef.current, prefsRef.current, merged);
    },
    [persistSettings],
  );

  const readIds = useMemo(() => listToReadMap(readIdsList), [readIdsList]);

  const value = useMemo<RequestsContextValue>(
    () => ({
      requests: state.requests,
      loading: state.loading,
      isOnline,
      syncing,
      pendingSyncCount,
      lastSyncedAt,
      servicePrices,
      prefs,
      readIds,
      refreshRequests,
      syncRequestsNow,
      getRequestById,
      createRequest,
      updateRequest,
      changeStatus,
      deleteRequest,
      updateServicePrice,
      updatePref,
      toggleNotificationRead,
      markNotificationsRead,
      resetDemo,
      clearAll,
    }),
    [
      state,
      isOnline,
      syncing,
      pendingSyncCount,
      lastSyncedAt,
      servicePrices,
      prefs,
      readIds,
      refreshRequests,
      syncRequestsNow,
      getRequestById,
      createRequest,
      updateRequest,
      changeStatus,
      deleteRequest,
      updateServicePrice,
      updatePref,
      toggleNotificationRead,
      markNotificationsRead,
      resetDemo,
      clearAll,
    ],
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}
