import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ORDER_CATEGORIES, OrderCategory } from '../../domain/models/order';
import { CatalogProduct } from '../../domain/models/product';
import { CATALOG_FALLBACK_ITEMS } from '../../infrastructure/services/catalogApiService';
import { useCatalog } from '../context/CatalogContext';
import { colors, common, fonts, radius, shadows, spacing } from '../theme';
import { ORDER_CATEGORY_META, TARGET_SPECIES_META } from '../utils/orderMeta';
import { EmptyState } from './EmptyState';
import { FilterOption, FilterTabs } from './FilterTabs';
import { PressableScale } from './PressableScale';
import { SearchBar } from './SearchBar';

interface Props {
  visible: boolean;
  selectedProductId?: number;
  excludeOrderId?: string;
  onSelect: (product: CatalogProduct) => void;
  onClose: () => void;
}

type CategoryFilter = OrderCategory | 'TODAS';

export function CatalogPickerModal({
  visible,
  selectedProductId,
  excludeOrderId,
  onSelect,
  onClose,
}: Props) {
  const { products, loading, getAvailableStock } = useCatalog();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('TODAS');

  const usingOfflineCatalog = products.length === 0;
  const availableProducts = useMemo(
    () => (products.length > 0 ? products : CATALOG_FALLBACK_ITEMS),
    [products],
  );

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setCategory('TODAS');
    }
  }, [visible]);

  const categoryOptions: FilterOption<CategoryFilter>[] = useMemo(
    () => [
      { value: 'TODAS', label: 'Todos', icon: 'grid-outline', color: colors.primary },
      ...ORDER_CATEGORIES.map((c) => ({
        value: c,
        label: ORDER_CATEGORY_META[c].label,
        color: ORDER_CATEGORY_META[c].color,
        icon: ORDER_CATEGORY_META[c].icon,
      })),
    ],
    [],
  );

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableProducts.filter((item) => {
      if (category !== 'TODAS' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    });
  }, [availableProducts, query, category]);

  const inStockCount = useMemo(
    () => availableProducts.filter((p) => getAvailableStock(p.id, excludeOrderId) > 0).length,
    [availableProducts, getAvailableStock, excludeOrderId],
  );

  const renderItem = ({ item }: { item: CatalogProduct }) => {
    const availableStock = getAvailableStock(item.id, excludeOrderId);
    const isSelected = item.id === selectedProductId;
    const isOutOfStock = availableStock <= 0 && !isSelected;
    const speciesMeta = TARGET_SPECIES_META[item.targetSpecies];

    return (
      <PressableScale
        onPress={() => onSelect(item)}
        disabled={isOutOfStock}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: isOutOfStock }}
        accessibilityLabel={`${item.title}, S/. ${item.price.toFixed(2)}, ${
          isOutOfStock ? 'Agotado' : `${availableStock} disponibles`
        }`}
        style={[
          styles.rowCard,
          isSelected && styles.rowCardSelected,
          isOutOfStock && styles.rowCardDisabled,
        ]}
        testID={`picker-product-${item.id}`}
      >
        <View style={styles.imageBox}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.rowBody}>
          <View style={styles.brandSkuRow}>
            <Text style={styles.brandText} numberOfLines={1}>
              {item.brand} · {item.sku}
            </Text>
            <Text style={styles.priceText}>S/. {item.price.toFixed(2)}</Text>
          </View>

          <Text style={styles.titleText} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.badgesRow}>
            <View style={[styles.speciesPill, { backgroundColor: speciesMeta.background }]}>
              <Text style={[styles.speciesPillText, { color: speciesMeta.color }]}>
                {speciesMeta.label}
              </Text>
            </View>
            {isOutOfStock ? (
              <View style={styles.outStockPill}>
                <Text style={styles.outStockText}>Agotado</Text>
              </View>
            ) : (
              <Text style={styles.stockText}>
                {availableStock} {availableStock === 1 ? 'disp.' : 'disp.'}
              </Text>
            )}
          </View>
        </View>

        {isSelected ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isOutOfStock ? colors.borderStrong : colors.textMuted}
          />
        )}
      </PressableScale>
    );
  };

  const renderEmpty = () => {
    if (loading && availableProducts.length === 0) {
      return (
        <View style={styles.stateCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Cargando productos...</Text>
        </View>
      );
    }

    return (
      <EmptyState
        compact
        icon="search-outline"
        title="Sin coincidencias"
        message="No hay productos que coincidan con tu búsqueda."
        actionLabel="Limpiar filtros"
        onAction={() => {
          setQuery('');
          setCategory('TODAS');
        }}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar selector" />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Elegir producto</Text>
              <Text style={styles.headerSub}>
                {usingOfflineCatalog
                  ? `Catálogo guardado · ${inStockCount} disponibles`
                  : `${inStockCount} de ${availableProducts.length} disponibles`}
              </Text>
            </View>
            <PressableScale
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de productos"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </PressableScale>
          </View>

          {availableProducts.length > 0 && (
            <View style={styles.controls}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por nombre, marca o código"
                testID="picker-search"
              />
              <FilterTabs
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                variant="chips"
                accessibilityLabel="Filtrar categoría"
              />
            </View>
          )}

          <FlatList
            data={visibleProducts}
            extraData={getAvailableStock}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.listContent,
              visibleProducts.length === 0 && styles.listEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    maxHeight: '86%',
    minHeight: '55%',
    ...shadows.raised,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  controls: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  listEmpty: {
    justifyContent: 'center',
  },
  rowCard: {
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rowCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWarm,
  },
  rowCardDisabled: {
    opacity: 0.6,
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  brandSkuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  brandText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flex: 1,
  },
  priceText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  titleText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.text,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  speciesPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  speciesPillText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
  },
  stockText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  outStockPill: {
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  outStockText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.dangerStrong,
  },
  stateCenter: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  stateText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  errorBox: {
    ...common.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderColor: colors.dangerBorder,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.dangerStrong,
  },
  errorMsg: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
