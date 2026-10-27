import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState, FilterOption, FilterTabs, PressableScale, RequestCard, SearchBar } from '../components';
import { useRequests } from '../context/RequestsContext';
import { Priority, PRIORITIES, RequestStatus, REQUEST_STATUSES } from '../models/request';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, common, fonts, radius, spacing, typography } from '../theme';
import { PRIORITY_META, STATUS_META } from '../utils/requestMeta';
import { countByStatus, filterRequests, sortByAttentionOrder } from '../utils/requests';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Requests'>,
  NativeStackScreenProps<RootStackParamList>
>;

type StatusFilter = RequestStatus | 'TODOS';
type PriorityFilter = Priority | 'TODAS';

export function RequestsScreen({ navigation, route }: Props) {
  const { requests, loading } = useRequests();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('TODOS');
  const [priority, setPriority] = useState<PriorityFilter>('TODAS');

  useEffect(() => {
    const params = route.params;
    if (!params?.nonce) return;
    setStatus(params.status ?? 'TODOS');
    setPriority(params.priority ?? 'TODAS');
    setQuery('');
  }, [route.params]);

  const counts = useMemo(() => countByStatus(requests), [requests]);

  const visible = useMemo(
    () => sortByAttentionOrder(filterRequests(requests, { query, status, priority })),
    [requests, query, status, priority],
  );

  const statusOptions: FilterOption<StatusFilter>[] = [
    { value: 'TODOS', label: 'Todas', count: requests.length },
    ...REQUEST_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label, count: counts[s] })),
  ];

  const priorityOptions: FilterOption<PriorityFilter>[] = [
    { value: 'TODAS', label: 'Todas las prioridades', icon: 'options-outline' },
    ...PRIORITIES.map((p) => ({
      value: p,
      label: PRIORITY_META[p].label,
      color: PRIORITY_META[p].color,
      icon: PRIORITY_META[p].icon,
    })),
  ];

  const hasFilters = query.trim() !== '' || status !== 'TODOS' || priority !== 'TODAS';
  const clearFilters = () => {
    setQuery('');
    setStatus('TODOS');
    setPriority('TODAS');
  };

  const openDetail = (id: string) => navigation.navigate('RequestDetail', { requestId: id });
  const openCreate = () => navigation.navigate('CreateRequest');

  const renderEmpty = () => {
    if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />;
    if (requests.length === 0) {
      return (
        <EmptyState
          icon="clipboard-outline"
          title="No hay solicitudes registradas"
          message="Cuando llegue un paciente, registra su solicitud para hacer seguimiento de su atención."
          actionLabel="Crear solicitud"
          onAction={openCreate}
        />
      );
    }
    return (
      <EmptyState
        icon="search-outline"
        title="Sin resultados"
        message={
          query
            ? `No encontramos solicitudes para “${query.trim()}”. Prueba con el nombre de la mascota, del cliente o el teléfono.`
            : 'Ninguna solicitud coincide con los filtros seleccionados.'
        }
        actionLabel="Limpiar filtros"
        onAction={clearFilters}
      />
    );
  };

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Admisión y Triaje</Text>
            <Text style={typography.title} accessibilityRole="header">
              Solicitudes
            </Text>
          </View>
          <PressableScale
            onPress={openCreate}
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel="Nueva solicitud"
            testID="requests-add"
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={16} color={colors.primary} />
            </View>
            <Text style={styles.addLabel}>Nueva</Text>
          </PressableScale>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por mascota, cliente o teléfono"
          testID="requests-search"
        />

        <View style={styles.filters}>
          <FilterTabs options={statusOptions} value={status} onChange={setStatus} accessibilityLabel="Estado" />
          <View style={{ marginTop: spacing.sm }}>
            <FilterTabs
              options={priorityOptions}
              value={priority}
              onChange={setPriority}
              variant="chips"
              accessibilityLabel="Prioridad"
            />
          </View>
        </View>

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RequestCard request={item} onPress={openDetail} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListHeaderComponent={
            visible.length > 0 ? (
              <View style={styles.resultsRow}>
                <Text style={typography.captionStrong}>
                  {visible.length} {visible.length === 1 ? 'solicitud' : 'solicitudes'}
                </Text>
                <View style={styles.sortHint}>
                  <Ionicons name="swap-vertical" size={12} color={colors.textMuted} />
                  <Text style={typography.caption}>Prioridad y llegada</Text>
                </View>
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
          contentContainerStyle={styles.list}
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
  filters: { marginTop: spacing.md },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sortHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footer: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
});
