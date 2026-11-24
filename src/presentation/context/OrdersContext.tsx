import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { fullName } from '../../application/services/authService';
import { OrderChanges, OrderInput, OrderStatus, PetOrder } from '../../domain/models/order';
import { isUsingNativeSqlite } from '../../infrastructure/database/sqlite';
import { sqliteOrderRepository } from '../../infrastructure/repositories/SqliteOrderRepository';
import {
  subscribeUserOrdersSnapshot,
  syncUserOrders,
} from '../../infrastructure/services/firebaseOrderSyncService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface OrdersContextValue {
  orders: PetOrder[];
  loading: boolean;
  error: string | null;
  usingNativeSqlite: boolean;
  isOnline: boolean;
  syncing: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  refreshOrders: () => Promise<void>;
  syncNow: (silent?: boolean) => Promise<void>;
  getOrderById: (id: string) => PetOrder | undefined;
  createOrder: (input: OrderInput) => Promise<PetOrder>;
  updateOrder: (id: string, changes: OrderChanges) => Promise<PetOrder>;
  changeOrderStatus: (id: string, status: OrderStatus) => Promise<PetOrder>;
  deleteOrder: (id: string) => Promise<boolean>;
  clearAllOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const userId = session?.uid;

  const [orders, setOrders] = useState<PetOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingNativeSqlite, setUsingNativeSqlite] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const syncingRef = useRef(false);
  const resyncQueuedRef = useRef(false);
  const isOnlineRef = useRef(true);
  const wasOfflineRef = useRef(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const loadLocalOrders = useCallback(async (uid?: string) => {
    if (!uid) {
      setOrders([]);
      setPendingSyncCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    setError(null);
    try {
      const [list, pending] = await Promise.all([
        sqliteOrderRepository.getAll(uid),
        sqliteOrderRepository.getPendingSync(uid),
      ]);
      setOrders(list);
      setPendingSyncCount(pending.length);
      setUsingNativeSqlite(isUsingNativeSqlite());
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los pedidos guardados.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    await loadLocalOrders(sessionRef.current?.uid);
  }, [loadLocalOrders]);

  const syncNow = useCallback(
    async (silent = false) => {
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
            'Tus pedidos quedan guardados y se enviarán al recuperar internet.',
          );
        }
        return;
      }

      syncingRef.current = true;
      setSyncing(true);
      try {
        const result = await syncUserOrders(uid);
        await loadLocalOrders(uid);
        setLastSyncedAt(new Date().toISOString());

        const sentCount = result.pushed + result.deleted;
        if (!silent) {
          if (result.failed > 0 && sentCount === 0) {
            showToast(
              'error',
              'Error de sincronización',
              'No se pudieron enviar los pedidos pendientes. Intenta nuevamente.',
            );
          } else if (sentCount > 0) {
            showToast(
              'success',
              'Pedidos sincronizados',
              result.storageWarning
                ? `${sentCount} ${sentCount === 1 ? 'cambio enviado' : 'cambios enviados'}. Comprobante guardado en el dispositivo.`
                : `${sentCount} ${sentCount === 1 ? 'cambio enviado' : 'cambios enviados'} correctamente.`,
            );
          } else {
            showToast('info', 'Todo al día', 'No hay pedidos pendientes por sincronizar.');
          }
        } else if (wasOfflineRef.current && sentCount > 0) {
          showToast(
            'success',
            'Conexión recuperada',
            `Se sincronizaron ${sentCount} ${sentCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'}.`,
          );
        }
      } catch {
        if (!silent) {
          showToast(
            'error',
            'Error de sincronización',
            'No se pudo completar la sincronización.',
          );
        }
      } finally {
        syncingRef.current = false;
        setSyncing(false);
        wasOfflineRef.current = false;
        if (resyncQueuedRef.current && isOnlineRef.current && sessionRef.current?.uid) {
          resyncQueuedRef.current = false;
          setTimeout(() => {
            void syncNow(true);
          }, 50);
        }
      }
    },
    [loadLocalOrders, showToast],
  );

  useEffect(() => {
    setLoading(true);
    setLastSyncedAt(null);
    loadLocalOrders(userId).then(() => {
      if (userId && isOnlineRef.current) {
        void syncNow(true);
      }
    });

    if (!userId) return;

    const unsubscribeRemote = subscribeUserOrdersSnapshot(userId, (remoteOrders) => {
      if (syncingRef.current) return;
      sqliteOrderRepository
        .reconcileRemoteSnapshot(userId, remoteOrders)
        .then(() => loadLocalOrders(userId))
        .catch(() => {});
    });

    return () => {
      unsubscribeRemote();
    };
  }, [userId, loadLocalOrders, syncNow]);

  useEffect(() => {
    let mounted = true;

    NetInfo.fetch()
      .then((state) => {
        if (!mounted) return;
        const online = Boolean(state.isConnected && state.isInternetReachable !== false);
        isOnlineRef.current = online;
        setIsOnline(online);
        if (!online) {
          wasOfflineRef.current = true;
        } else if (sessionRef.current?.uid) {
          void syncNow(true);
        }
      })
      .catch(() => {});

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      const prevOnline = isOnlineRef.current;
      isOnlineRef.current = online;
      setIsOnline(online);

      if (!online) {
        wasOfflineRef.current = true;
      } else if (!prevOnline && sessionRef.current?.uid) {
        wasOfflineRef.current = true;
        void syncNow(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [syncNow]);

  const getOrderById = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  );

  const createOrder = useCallback(
    async (input: OrderInput) => {
      const activeSession = sessionRef.current;
      const enrichedInput: OrderInput = {
        ...input,
        userId: input.userId ?? activeSession?.uid,
        registradoPor: input.registradoPor ?? (fullName(activeSession) || undefined),
        registradoPorUsuario: input.registradoPorUsuario ?? activeSession?.email,
      };
      const created = await sqliteOrderRepository.create(enrichedInput);
      setUsingNativeSqlite(isUsingNativeSqlite());
      setOrders((prev) => [created, ...prev]);
      setPendingSyncCount((c) => c + 1);

      if (isOnlineRef.current && enrichedInput.userId) {
        void syncNow(true);
      }

      return created;
    },
    [syncNow],
  );

  const updateOrder = useCallback(
    async (id: string, changes: OrderChanges) => {
      const updated = await sqliteOrderRepository.update(id, changes);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (sessionRef.current?.uid) {
        const pending = await sqliteOrderRepository.getPendingSync(sessionRef.current.uid);
        setPendingSyncCount(pending.length);
        if (isOnlineRef.current) {
          void syncNow(true);
        }
      }
      return updated;
    },
    [syncNow],
  );

  const changeOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      const updated = await sqliteOrderRepository.changeStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (sessionRef.current?.uid) {
        const pending = await sqliteOrderRepository.getPendingSync(sessionRef.current.uid);
        setPendingSyncCount(pending.length);
        if (isOnlineRef.current) {
          void syncNow(true);
        }
      }
      return updated;
    },
    [syncNow],
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      const deleted = await sqliteOrderRepository.delete(id);
      if (deleted) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        if (sessionRef.current?.uid) {
          const pending = await sqliteOrderRepository.getPendingSync(sessionRef.current.uid);
          setPendingSyncCount(pending.length);
          if (isOnlineRef.current) {
            void syncNow(true);
          }
        }
      }
      return deleted;
    },
    [syncNow],
  );

  const clearAllOrders = useCallback(async () => {
    const uid = sessionRef.current?.uid;
    const currentOrders = await sqliteOrderRepository.getAll(uid);
    for (const order of currentOrders) {
      await sqliteOrderRepository.delete(order.id);
    }
    setOrders([]);
    if (uid) {
      const pending = await sqliteOrderRepository.getPendingSync(uid);
      setPendingSyncCount(pending.length);
      if (isOnlineRef.current) {
        void syncNow(true);
      }
    } else {
      setPendingSyncCount(0);
    }
  }, [syncNow]);

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      loading,
      error,
      usingNativeSqlite,
      isOnline,
      syncing,
      pendingSyncCount,
      lastSyncedAt,
      refreshOrders,
      syncNow,
      getOrderById,
      createOrder,
      updateOrder,
      changeOrderStatus,
      deleteOrder,
      clearAllOrders,
    }),
    [
      orders,
      loading,
      error,
      usingNativeSqlite,
      isOnline,
      syncing,
      pendingSyncCount,
      lastSyncedAt,
      refreshOrders,
      syncNow,
      getOrderById,
      createOrder,
      updateOrder,
      changeOrderStatus,
      deleteOrder,
      clearAllOrders,
    ],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrders debe usarse dentro de <OrdersProvider>.');
  }
  return ctx;
}
