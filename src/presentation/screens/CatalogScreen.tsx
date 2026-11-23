import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { calculateOrderTotal } from '../../application/services/orderService';
import { ORDER_CATEGORIES, OrderCategory } from '../../domain/models/order';
import { CatalogProduct } from '../../domain/models/product';
import {
  EmptyState,
  FadeInView,
  FilterOption,
  FilterTabs,
  IconButton,
  OrderCategoryChip,
  PressableScale,
  PrimaryButton,
  SearchBar,
} from '../components';
import { useCatalog } from '../context/CatalogContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { ORDER_CATEGORY_META, TARGET_SPECIES_META } from '../utils/orderMeta';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Catalog'>,
  NativeStackScreenProps<RootStackParamList>
>;

type CategoryFilter = OrderCategory | 'TODAS';
type SpeciesFilter = 'TODOS' | 'PERRO' | 'GATO';

const SPECIES_FILTERS: { value: SpeciesFilter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PERRO', label: 'Perro' },
  { value: 'GATO', label: 'Gato' },
];

export function CatalogScreen({ navigation }: Props) {
  const { products, loading, refreshing, error, refreshCatalog, getAvailableStock } = useCatalog();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('TODAS');
  const [species, setSpecies] = useState<SpeciesFilter>('TODOS');
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null);
  const [modalQty, setModalQty] = useState(1);

  const handleManualRefresh = async () => {
    const res = await refreshCatalog(false);
    if (res.success) {
      showToast('success', 'Catálogo actualizado', `${res.count} productos disponibles.`);
    } else if (res.error) {
      showToast('error', 'Sin conexión', res.error);
    }
  };

  const handleOrderProduct = (item: CatalogProduct, quantity = 1) => {
    navigation.navigate('CreateOrder', {
      initialProductId: item.id,
      initialQuantity: quantity,
    });
  };

  const openPreview = (item: CatalogProduct) => {
    setModalQty(1);
    setPreviewProduct(item);
  };

  const closePreview = () => {
    setPreviewProduct(null);
  };

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
    return products.filter((item) => {
      if (category !== 'TODAS' && item.category !== category) return false;
      if (species === 'PERRO' && item.targetSpecies === 'GATO') return false;
      if (species === 'GATO' && item.targetSpecies === 'PERRO') return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [products, query, category, species]);

  const previewStock = previewProduct ? getAvailableStock(previewProduct.id) : 0;
  const clampedModalQty = previewStock > 0 ? Math.min(modalQty, previewStock) : 1;
  const previewRemainingStock =
    previewStock > 0 ? Math.max(0, previewStock - clampedModalQty) : 0;

  const renderProduct = ({ item, index }: { item: CatalogProduct; index: number }) => {
    const availableStock = getAvailableStock(item.id);
    const isOutOfStock = availableStock <= 0;
    const speciesMeta = TARGET_SPECIES_META[item.targetSpecies];

    return (
      <FadeInView delay={Math.min(index * 30, 160)} distance={6}>
        <PressableScale
          onPress={() => openPreview(item)}
          style={styles.productCard}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalles de ${item.title}`}
          testID={`catalog-card-${item.id}`}
        >
          <View style={styles.productTop}>
            <View style={styles.imageContainer}>
              <Image source={item.image} style={styles.productImage} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={styles.brandPriceRow}>
                <Text style={styles.brandText} numberOfLines={1}>
                  {item.brand}
                </Text>
                <Text style={styles.priceText}>S/. {item.price.toFixed(2)}</Text>
              </View>
              <Text style={styles.productTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.productDesc} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </View>

          <View style={styles.productFooter}>
            <View style={styles.metaLeft}>
              <OrderCategoryChip category={item.category} />
              <View style={[styles.speciesBadge, { backgroundColor: speciesMeta.background }]}>
                <Text style={[styles.speciesBadgeText, { color: speciesMeta.color }]} numberOfLines={1}>
                  {speciesMeta.label}
                </Text>
              </View>
              <Text style={[styles.stockText, isOutOfStock && styles.outStockText]} numberOfLines={1}>
                {isOutOfStock ? 'Agotado' : `${availableStock} disp.`}
              </Text>
            </View>

            <PressableScale
              onPress={(e) => {
                e?.stopPropagation?.();
                handleOrderProduct(item, 1);
              }}
              disabled={isOutOfStock}
              style={[styles.orderBtn, isOutOfStock && styles.orderBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel={`Crear pedido con ${item.title}`}
              testID={`catalog-order-${item.id}`}
            >
              <Ionicons
                name="cart-outline"
                size={14}
                color={isOutOfStock ? colors.textMuted : colors.primaryDark}
              />
              <Text style={[styles.orderBtnText, isOutOfStock && { color: colors.textMuted }]}>
                Pedir
              </Text>
            </PressableScale>
          </View>
        </PressableScale>
      </FadeInView>
    );
  };

  const renderEmptyOrState = () => {
    if (loading && products.length === 0) {
      return (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateTitle}>Cargando productos...</Text>
        </View>
      );
    }

    if (error && products.length === 0) {
      return (
        <View style={styles.errorCard}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Sin conexión</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <PrimaryButton
            title="Reintentar"
            onPress={handleManualRefresh}
            icon="refresh-outline"
            compact
            testID="catalog-retry"
          />
        </View>
      );
    }

    if (products.length > 0 && visibleProducts.length === 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="Sin coincidencias"
          message="No hay productos que coincidan con tu búsqueda."
          actionLabel="Limpiar filtros"
          onAction={() => {
            setQuery('');
            setCategory('TODAS');
            setSpecies('TODOS');
          }}
        />
      );
    }

    return (
      <EmptyState
        icon="cube-outline"
        title="Sin productos disponibles"
        message="No hay artículos registrados en este momento."
        actionLabel="Reintentar"
        onAction={handleManualRefresh}
      />
    );
  };

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <View style={styles.container}>
        <FadeInView delay={30} distance={8}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSubtitle}>Tienda</Text>
              <Text style={typography.title} accessibilityRole="header">
                Catálogo
              </Text>
            </View>
            <IconButton
              icon="refresh-outline"
              onPress={handleManualRefresh}
              disabled={loading || refreshing}
              accessibilityLabel="Actualizar catálogo"
              size={40}
              testID="catalog-refresh-btn"
            />
          </View>
        </FadeInView>

        {error && products.length > 0 && (
          <View style={styles.inlineErrorBox}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.danger} />
            <Text style={styles.inlineErrorText} numberOfLines={2}>
              {error}
            </Text>
            <PrimaryButton
              title="Reintentar"
              onPress={handleManualRefresh}
              compact
              variant="outline"
            />
          </View>
        )}

        {products.length > 0 && (
          <FadeInView delay={60} distance={8}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por producto, marca o código"
              testID="catalog-search"
            />
            <View style={styles.filters}>
              <FilterTabs
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                variant="chips"
                accessibilityLabel="Categoría"
              />
              <View style={styles.speciesRow} accessibilityRole="tablist" accessibilityLabel="Especie">
                {SPECIES_FILTERS.map((opt) => {
                  const active = species === opt.value;
                  return (
                    <PressableScale
                      key={opt.value}
                      onPress={() => setSpecies(opt.value)}
                      style={[styles.speciesPillBtn, active && styles.speciesPillBtnActive]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      testID={`catalog-species-${opt.value}`}
                    >
                      <Text
                        style={[styles.speciesPillLabel, active && styles.speciesPillLabelActive]}
                      >
                        {opt.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          </FadeInView>
        )}

        <FlatList
          data={loading && products.length === 0 ? [] : visibleProducts}
          extraData={getAvailableStock}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            visibleProducts.length > 0 ? (
              <View style={styles.resultsRow}>
                <Text style={typography.captionStrong}>
                  {visibleProducts.length}{' '}
                  {visibleProducts.length === 1 ? 'producto' : 'productos'}
                </Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={renderEmptyOrState}
          contentContainerStyle={[
            styles.list,
            ((loading && products.length === 0) || visibleProducts.length === 0) &&
              styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      <Modal
        visible={previewProduct !== null}
        animationType="slide"
        transparent
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePreview}
            accessibilityLabel="Cerrar detalle de producto"
          />
          {previewProduct && (
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTopActions}>
                <View style={styles.modalSkuBadge}>
                  <Text style={styles.modalSkuText}>{previewProduct.sku}</Text>
                </View>
                <PressableScale
                  onPress={closePreview}
                  style={styles.modalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar detalle"
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </PressableScale>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <View style={styles.modalImageFrame}>
                  <Image
                    source={previewProduct.image}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.modalBadgesRow}>
                  <OrderCategoryChip category={previewProduct.category} size="md" />
                  <View
                    style={[
                      styles.speciesBadgeLg,
                      { backgroundColor: TARGET_SPECIES_META[previewProduct.targetSpecies].background },
                    ]}
                  >
                    <Ionicons
                      name="paw-outline"
                      size={13}
                      color={TARGET_SPECIES_META[previewProduct.targetSpecies].color}
                    />
                    <Text
                      style={[
                        styles.speciesBadgeLgText,
                        { color: TARGET_SPECIES_META[previewProduct.targetSpecies].color },
                      ]}
                    >
                      {TARGET_SPECIES_META[previewProduct.targetSpecies].label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalBrand}>{previewProduct.brand}</Text>
                <Text style={styles.modalTitle}>{previewProduct.title}</Text>
                <Text style={styles.modalDesc}>{previewProduct.description}</Text>

                <View style={styles.modalInfoStrip}>
                  <View style={styles.modalInfoCol}>
                    <Text style={styles.modalInfoLabel}>Precio unitario</Text>
                    <Text style={styles.modalInfoPrice}>S/. {previewProduct.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.modalInfoDivider} />
                  <View style={styles.modalInfoCol}>
                    <Text style={styles.modalInfoLabel}>Stock restante</Text>
                    <Text
                      style={[
                        styles.modalInfoStock,
                        previewStock <= 0
                          ? { color: colors.dangerStrong }
                          : previewRemainingStock === 0
                          ? { color: colors.pending }
                          : undefined,
                      ]}
                    >
                      {previewStock > 0
                        ? `${previewRemainingStock} ${
                            previewRemainingStock === 1 ? 'unidad' : 'unidades'
                          }`
                        : 'Sin stock'}
                    </Text>
                    {previewStock > 0 && (
                      <Text style={styles.modalInfoSub}>de {previewStock} disp.</Text>
                    )}
                  </View>
                </View>

                {previewStock > 0 && (
                  <View style={styles.modalQtyRow}>
                    <Text style={styles.modalQtyLabel}>Cantidad para el pedido</Text>
                    <View style={styles.modalQtyBox}>
                      <PressableScale
                        onPress={() => setModalQty((q) => Math.max(1, q - 1))}
                        disabled={clampedModalQty <= 1}
                        style={styles.modalQtyBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Disminuir cantidad"
                      >
                        <Ionicons name="remove" size={18} color={colors.text} />
                      </PressableScale>
                      <Text style={styles.modalQtyValue}>{clampedModalQty}</Text>
                      <PressableScale
                        onPress={() => setModalQty((q) => Math.min(previewStock, q + 1))}
                        disabled={clampedModalQty >= previewStock}
                        style={styles.modalQtyBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Aumentar cantidad"
                      >
                        <Ionicons name="add" size={18} color={colors.text} />
                      </PressableScale>
                    </View>
                  </View>
                )}

                <PrimaryButton
                  title={
                    previewStock > 0
                      ? `Crear pedido · S/. ${calculateOrderTotal(
                          clampedModalQty,
                          previewProduct.price,
                        ).toFixed(2)}`
                      : 'Sin stock disponible'
                  }
                  onPress={() => {
                    const selected = previewProduct;
                    const qty = clampedModalQty;
                    closePreview();
                    handleOrderProduct(selected, qty);
                  }}
                  disabled={previewStock <= 0}
                  icon="cart-outline"
                  testID="catalog-modal-order"
                  style={{ marginTop: spacing.xs }}
                />
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
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
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  inlineErrorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.dangerStrong,
  },
  filters: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  speciesPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  speciesPillBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  speciesPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  speciesPillLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryDark,
  },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productCard: {
    ...common.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  imageContainer: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  brandPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  brandText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  productTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  priceText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  productDesc: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  speciesBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.sm,
  },
  speciesBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
  },
  stockText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  outStockText: {
    color: colors.dangerStrong,
    fontFamily: fonts.semibold,
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  orderBtnDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  orderBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  stateBox: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  stateTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorCard: {
    ...common.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderColor: colors.dangerBorder,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.dangerStrong,
    textAlign: 'center',
  },
  errorMsg: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
    ...shadows.raised,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalSkuBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSkuText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  modalImageFrame: {
    height: 180,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginTop: spacing.xxs,
  },
  speciesBadgeLg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radius.sm,
  },
  speciesBadgeLgText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  modalBrand: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    lineHeight: 24,
  },
  modalDesc: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalInfoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  modalInfoCol: {
    flex: 1,
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  modalInfoPrice: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  modalInfoStock: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.done,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  modalInfoSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  modalInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  modalQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  modalQtyLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalQtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  modalQtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalQtyValue: {
    minWidth: 32,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
