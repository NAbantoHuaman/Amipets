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
import { getCommittedUnitsForProduct } from '../../application/services/orderService';
import { CatalogProduct } from '../../domain/models/product';
import {
  fetchCatalogProducts,
  findCatalogProductAsset,
} from '../../infrastructure/services/catalogApiService';
import { useOrders } from './OrdersContext';

export interface CatalogRefreshResult {
  success: boolean;
  count: number;
  error?: string;
}

export interface CatalogContextValue {
  products: CatalogProduct[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshCatalog: (silent?: boolean) => Promise<CatalogRefreshResult>;
  getProductById: (id: number) => CatalogProduct | undefined;
  getAvailableStock: (productId: number, excludeOrderId?: string) => number;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { orders } = useOrders();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasProductsRef = useRef(false);
  const productsCountRef = useRef(0);

  const refreshCatalog = useCallback(async (silent = false): Promise<CatalogRefreshResult> => {
    const hasExisting = hasProductsRef.current;
    if (hasExisting) {
      if (!silent) setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const list = await fetchCatalogProducts();
      hasProductsRef.current = list.length > 0;
      productsCountRef.current = list.length;
      setProducts(list);
      return { success: true, count: list.length };
    } catch (err: any) {
      const message =
        err?.message || 'No se pudo cargar el catálogo. Revisa tu conexión e intenta nuevamente.';
      setError(message);
      return {
        success: false,
        count: hasProductsRef.current ? productsCountRef.current : 0,
        error: message,
      };
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog(true);
  }, [refreshCatalog]);

  const getProductById = useCallback(
    (id: number) => products.find((p) => p.id === id) ?? findCatalogProductAsset(id),
    [products],
  );

  const getAvailableStock = useCallback(
    (productId: number, excludeOrderId?: string) => {
      const product = getProductById(productId);
      if (!product) return 0;
      const committed = getCommittedUnitsForProduct(
        orders,
        product.id,
        product.title,
        excludeOrderId,
      );
      return Math.max(0, product.stock - committed);
    },
    [getProductById, orders],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      loading,
      refreshing,
      error,
      refreshCatalog,
      getProductById,
      getAvailableStock,
    }),
    [products, loading, refreshing, error, refreshCatalog, getProductById, getAvailableStock],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog debe usarse dentro de <CatalogProvider>.');
  }
  return ctx;
}
