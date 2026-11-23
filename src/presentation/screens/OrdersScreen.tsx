import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  calculateOrderTotal,
  countOrdersByStatus,
  filterOrders,
  sortOrders,
} from '../../application/services/orderService';
import {
  ORDER_CATEGORIES,
  ORDER_STATUSES,
  OrderCategory,
  OrderStatus,
} from '../../domain/models/order';
import {
  EmptyState,
  FadeInView,
  FilterOption,
  FilterTabs,
  OrderCard,
  PressableScale,
  PrimaryButton,
  SearchBar,
} from '../components';
import { useAuth, shortGreetingName } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, common, fonts, radius, spacing, typography } from '../theme';
import { ORDER_CATEGORY_META, ORDER_STATUS_META } from '../utils/orderMeta';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Orders'>,
  NativeStackScreenProps<RootStackParamList>
>;

type StatusFilter = OrderStatus | 'TODOS';
type CategoryFilter = OrderCategory | 'TODAS';

export function OrdersScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const {
    orders,
    loading,
    error,
    isOnline,
    syncing,
    pendingSyncCount,
    refreshOrders,
    syncNow,
  } = useOrders();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('TODOS');
  const [category, setCategory] = useState<CategoryFilter>('TODAS');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const params = route.params;
    if (!params?.nonce) return;
    setStatus(params.status ?? 'TODOS');
    setCategory('TODAS');
    setQuery('');
  }, [route.params]);

  const counts = useMemo(() => countOrdersByStatus(orders), [orders]);

  const visible = useMemo(
    () => sortOrders(filterOrders(orders, query, status, category)),
    [orders, query, status, category],
  );

  const visibleTotalAmount = useMemo(
    () =>
      visible.reduce(
        (acc, o) =>
          o.estado === 'CANCELADO' ? acc : acc + calculateOrderTotal(o.cantidad, o.precio),
        0,
      ),
    [visible],
  );

  const statusOptions: FilterOption<StatusFilter>[] = useMemo(
    () => [
      { value: 'TODOS', label: 'Todos', count: orders.length },
      ...ORDER_STATUSES.map((s) => ({
        value: s,
        label: ORDER_STATUS_META[s].label,
        count: counts[s],
      })),
    ],
    [orders.length, counts],
  );

  const categoryOptions: FilterOption<CategoryFilter>[] = useMemo(
    () => [
      { value: 'TODAS', label: 'Todas las categorías', icon: 'grid-outline', color: colors.primary },
      ...ORDER_CATEGORIES.map((c) => ({
        value: c,
        label: ORDER_CATEGORY_META[c].label,
        color: ORDER_CATEGORY_META[c].color,
        icon: ORDER_CATEGORY_META[c].icon,
      })),
    ],
    [],
  );

  const hasFilters = query.trim() !== '' || status !== 'TODOS' || category !== 'TODAS';
  const clearFilters = () => {
    setQuery('');
    setStatus('TODOS');
    setCategory('TODAS');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
      if (isOnline) {
        await syncNow(false);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const openDetail = (id: string) => navigation.navigate('OrderDetail', { orderId: id });
  const openCreate = () => navigation.navigate('CreateOrder');

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>
            Cargando pedidos...
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="alert-circle-outline"
            title="No se pudieron cargar los pedidos"
            message={error}
            actionLabel="Reintentar"
            onAction={refreshOrders}
          />
        </View>
      );
    }
    if (orders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="bag-handle-outline"
            title="Aún no hay pedidos"
            message="Registra los pedidos del catálogo para tus clientes."
            actionLabel="Nuevo pedido"
            onAction={openCreate}
          />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="search-outline"
          title="Sin coincidencias"
          message={
            query
              ? `No encontramos pedidos para "${query.trim()}". Prueba con otro cliente o producto.`
              : 'Ningún pedido coincide con el filtro seleccionado.'
          }
          actionLabel="Limpiar filtros"
          onAction={clearFilters}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <View style={styles.container}>
        <FadeInView delay={30} distance={8}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSubtitle}>
                Historial de {shortGreetingName(session) || 'tu cuenta'}
              </Text>
              <Text style={typography.title} accessibilityRole="header">
                Pedidos
              </Text>
            </View>
            <PressableScale
              onPress={openCreate}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Nuevo pedido"
              testID="orders-add"
            >
              <View style={styles.addIcon}>
                <Ionicons name="add" size={16} color={colors.primary} />
              </View>
              <Text style={styles.addLabel}>Nuevo</Text>
            </PressableScale>
          </View>
        </FadeInView>

        {(!isOnline || pendingSyncCount > 0 || syncing) && (
          <View
            style={[
              styles.syncBanner,
              !isOnline
                ? styles.syncBannerOffline
                : syncing
                ? styles.syncBannerSyncing
                : styles.syncBannerPending,
            ]}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.primaryDark} />
            ) : (
              <Ionicons
                name={!isOnline ? 'cloud-offline-outline' : 'cloud-upload-outline'}
                size={16}
                color={!isOnline ? colors.textSecondary : colors.pending}
              />
            )}
            <Text style={styles.syncBannerText} numberOfLines={2}>
              {syncing
                ? 'Sincronizando pedidos...'
                : !isOnline
                ? `Sin conexión · Guardado local${
                    pendingSyncCount > 0 ? ` (${pendingSyncCount} por enviar)` : ''
                  }`
                : `${pendingSyncCount} ${
                    pendingSyncCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'
                  } de envío`}
            </Text>
            {isOnline && !syncing && pendingSyncCount > 0 && (
              <PressableScale
                onPress={() => syncNow(false)}
                style={styles.syncActionPill}
                accessibilityRole="button"
                accessibilityLabel="Sincronizar pedidos pendientes"
              >
                <Text style={styles.syncActionText}>Sincronizar</Text>
              </PressableScale>
            )}
          </View>
        )}

        <FadeInView delay={70} distance={10}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por cliente, producto, marca o código"
            testID="orders-search"
          />
        </FadeInView>

        <FadeInView delay={110} distance={10}>
          <View style={styles.filters}>
            <FilterTabs
              options={statusOptions}
              value={status}
              onChange={setStatus}
              variant="underline"
              accessibilityLabel="Estado del pedido"
            />
            <View style={{ marginTop: spacing.sm }}>
              <FilterTabs
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                variant="chips"
                accessibilityLabel="Categoría del producto"
              />
            </View>
          </View>
        </FadeInView>

        {error && orders.length > 0 && (
          <View style={styles.inlineErrorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.inlineErrorText} numberOfLines={2}>
              {error}
            </Text>
            <PrimaryButton title="Reintentar" onPress={refreshOrders} compact variant="outline" />
          </View>
        )}

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <FadeInView delay={Math.min(index * 35, 180)} distance={6}>
              <OrderCard order={item} onPress={openDetail} />
            </FadeInView>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            visible.length > 0 ? (
              <View style={styles.resultsRow}>
                <Text style={typography.captionStrong}>
                  {visible.length} {visible.length === 1 ? 'pedido' : 'pedidos'}
                </Text>
                <Text style={styles.totalSummary}>
                  Total activo: S/. {visibleTotalAmount.toFixed(2)}
                </Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            hasFilters && visible.length > 0 ? (
              <Text style={styles.footer} onPress={clearFilters} accessibilityRole="button">
                Limpiar filtros
              </Text>
            ) : undefined
          }
          contentContainerStyle={[styles.list, visible.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    marginBottom: spacing.md,
  },
  headerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 },
  addIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  syncBannerOffline: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
  },
  syncBannerPending: {
    backgroundColor: colors.pendingSoft,
    borderColor: colors.pending + '40',
  },
  syncBannerSyncing: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  syncBannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  syncActionPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  syncActionText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.primaryDark,
  },
  filters: { marginTop: spacing.md },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  inlineErrorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.dangerStrong,
  },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalSummary: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
});
