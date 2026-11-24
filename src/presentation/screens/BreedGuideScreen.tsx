import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BreedSpecies, PetBreed } from '../../domain/models/breed';
import {
  fetchCatBreeds,
  fetchDogBreedsPage,
  getCachedCatBreeds,
  getCachedDogBreeds,
} from '../../infrastructure/services/breedsApiService';
import {
  EmptyState,
  PawBackdrop,
  PetAvatar,
  PressableScale,
  PrimaryButton,
  ScreenHeader,
  SearchBar,
} from '../components';
import { RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BreedGuide'>;

export function BreedGuideScreen({ navigation }: Props) {
  const [species, setSpecies] = useState<BreedSpecies>('PERRO');
  const [query, setQuery] = useState<string>('');

  const [dogBreeds, setDogBreeds] = useState<PetBreed[]>([]);
  const [dogNextPage, setDogNextPage] = useState<number | null>(null);
  const [dogLoading, setDogLoading] = useState<boolean>(true);
  const [dogLoadingMore, setDogLoadingMore] = useState<boolean>(false);
  const [dogError, setDogError] = useState<string | null>(null);
  const [dogFromCache, setDogFromCache] = useState<boolean>(false);

  const [catBreeds, setCatBreeds] = useState<PetBreed[]>([]);
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catFromCache, setCatFromCache] = useState<boolean>(false);

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedBreed, setSelectedBreed] = useState<PetBreed | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const loadDogs = useCallback(async (page = 1, append = false) => {
    if (append) {
      setDogLoadingMore(true);
    } else {
      setDogLoading(true);
      setDogError(null);
      setDogFromCache(false);
    }

    try {
      const result = await fetchDogBreedsPage(page, 30);
      setDogBreeds((prev) => {
        if (!append) return result.items;
        const existingIds = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !existingIds.has(item.id))];
      });
      setDogNextPage(result.nextPage);
    } catch (err) {
      if (!append) {
        const cached = await getCachedDogBreeds();
        if (cached.length > 0) {
          setDogBreeds(cached);
          setDogNextPage(null);
          setDogFromCache(true);
          return;
        }
        setDogError(err instanceof Error ? err.message : 'No se pudo cargar la guía de perros.');
      }
    } finally {
      setDogLoading(false);
      setDogLoadingMore(false);
    }
  }, []);

  const loadCats = useCallback(async () => {
    setCatLoading(true);
    setCatError(null);
    setCatFromCache(false);

    try {
      const result = await fetchCatBreeds();
      setCatBreeds(result);
    } catch (err) {
      const cached = await getCachedCatBreeds();
      if (cached.length > 0) {
        setCatBreeds(cached);
        setCatFromCache(true);
        return;
      }
      setCatError(err instanceof Error ? err.message : 'No se pudo cargar la guía de gatos.');
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDogs(1, false);
  }, [loadDogs]);

  useEffect(() => {
    if (species === 'GATO' && catBreeds.length === 0 && !catLoading && !catError) {
      void loadCats();
    }
  }, [species, catBreeds.length, catLoading, catError, loadCats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (species === 'PERRO') {
      await loadDogs(1, false);
    } else {
      await loadCats();
    }
    setRefreshing(false);
  };

  const activeItems = species === 'PERRO' ? dogBreeds : catBreeds;
  const activeLoading = species === 'PERRO' ? dogLoading : catLoading;
  const activeError = species === 'PERRO' ? dogError : catError;
  const activeFromCache = species === 'PERRO' ? dogFromCache : catFromCache;

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.origin?.toLowerCase().includes(q) ?? false) ||
        (item.coat?.toLowerCase().includes(q) ?? false),
    );
  }, [activeItems, query]);

  const renderBreedCard = ({ item }: { item: PetBreed }) => {
    const showPhoto = Boolean(item.imageUrl && !failedImages[item.id]);

    return (
      <PressableScale
        onPress={() => setSelectedBreed(item)}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Ver ficha de raza ${item.name}`}
      >
        {showPhoto ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
          />
        ) : (
          <PetAvatar species={item.species} size={64} shape="rounded" />
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            {item.hypoallergenic && (
              <View style={styles.hypoPill}>
                <Text style={styles.hypoPillText}>Hipoalergénico</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardMeta} numberOfLines={1}>
            {[item.origin, item.coat, item.pattern].filter(Boolean).join(' · ') ||
              'Ficha veterinaria de referencia'}
          </Text>

          <View style={styles.cardBadgesRow}>
            {item.weightRange && (
              <View style={styles.miniBadge}>
                <Ionicons name="scale-outline" size={11} color={colors.primaryDark} />
                <Text style={styles.miniBadgeText}>{item.weightRange}</Text>
              </View>
            )}
            {item.lifeSpan && (
              <View style={styles.miniBadge}>
                <Ionicons name="heart-outline" size={11} color={colors.accent} />
                <Text style={styles.miniBadgeText}>{item.lifeSpan}</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </PressableScale>
    );
  };

  return (
    <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
      <PawBackdrop variant="list" />
      <ScreenHeader
        title="Guía de razas"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.topControls}>
        <View style={styles.segmentWrap} accessibilityRole="tablist">
          {(['PERRO', 'GATO'] as BreedSpecies[]).map((sp) => {
            const active = species === sp;
            return (
              <PressableScale
                key={sp}
                onPress={() => {
                  setSpecies(sp);
                  setQuery('');
                }}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                testID={`breeds-tab-${sp}`}
              >
                <Ionicons
                  name="paw-outline"
                  size={15}
                  color={active ? colors.primaryDark : colors.textSecondary}
                />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {sp === 'PERRO' ? 'Perros' : 'Gatos'}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={`Buscar raza de ${species === 'PERRO' ? 'perro' : 'gato'} u origen...`}
          testID="breeds-search"
        />

        {activeFromCache && (
          <View style={styles.cacheBanner}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.pending} />
            <Text style={styles.cacheBannerText}>
              Sin conexión · Mostrando fichas guardadas en el dispositivo
            </Text>
          </View>
        )}
      </View>

      {activeLoading && activeItems.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Cargando guía clínica de razas...</Text>
        </View>
      ) : activeError && activeItems.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No se pudo cargar la guía"
          message={activeError}
          actionLabel="Reintentar"
          onAction={() => (species === 'PERRO' ? void loadDogs(1, false) : void loadCats())}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderBreedCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              compact
              icon="search-outline"
              title="Sin coincidencias"
              message={`No encontramos razas que coincidan con "${query}".`}
            />
          }
          ListFooterComponent={
            species === 'PERRO' && dogNextPage !== null && !query.trim() ? (
              <View style={styles.footerWrap}>
                <PrimaryButton
                  title={dogLoadingMore ? 'Cargando más razas...' : 'Cargar más razas'}
                  onPress={() => void loadDogs(dogNextPage, true)}
                  loading={dogLoadingMore}
                  variant="secondary"
                  compact
                  icon="add-circle-outline"
                  trailingIcon={null}
                />
              </View>
            ) : undefined
          }
        />
      )}

      <Modal
        visible={selectedBreed !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBreed(null)}
      >
        {selectedBreed && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalEyebrow}>
                    {selectedBreed.species === 'PERRO' ? 'Canino' : 'Felino'}
                    {selectedBreed.origin ? ` · ${selectedBreed.origin}` : ''}
                  </Text>
                  <Text style={styles.modalTitle}>{selectedBreed.name}</Text>
                </View>
                <PressableScale
                  onPress={() => setSelectedBreed(null)}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar ficha de raza"
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </PressableScale>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {selectedBreed.imageUrl && !failedImages[selectedBreed.id] ? (
                  <Image
                    source={{ uri: selectedBreed.imageUrl }}
                    style={styles.modalPhoto}
                    resizeMode="cover"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [selectedBreed.id]: true }))
                    }
                  />
                ) : (
                  <View style={styles.modalAvatarBox}>
                    <PetAvatar species={selectedBreed.species} size={78} shape="rounded" />
                  </View>
                )}

                <View style={styles.factsGrid}>
                  {selectedBreed.lifeSpan && (
                    <FactBox icon="heart-outline" label="Esperanza de vida" value={selectedBreed.lifeSpan} />
                  )}
                  {selectedBreed.weightRange && (
                    <FactBox icon="scale-outline" label="Peso promedio" value={selectedBreed.weightRange} />
                  )}
                  {selectedBreed.coat && (
                    <FactBox icon="layers-outline" label="Pelaje" value={selectedBreed.coat} />
                  )}
                  {selectedBreed.pattern && (
                    <FactBox icon="color-palette-outline" label="Patrón" value={selectedBreed.pattern} />
                  )}
                  {typeof selectedBreed.exerciseMinutes === 'number' && (
                    <FactBox
                      icon="walk-outline"
                      label="Ejercicio diario"
                      value={`${selectedBreed.exerciseMinutes} min/día`}
                    />
                  )}
                  {typeof selectedBreed.energyLevel === 'number' && (
                    <FactBox
                      icon="flash-outline"
                      label="Nivel de energía"
                      value={`${selectedBreed.energyLevel} / 5`}
                    />
                  )}
                  {typeof selectedBreed.groomingLevel === 'number' && (
                    <FactBox
                      icon="cut-outline"
                      label="Cuidado de pelaje"
                      value={`${selectedBreed.groomingLevel} / 5`}
                    />
                  )}
                  {selectedBreed.hypoallergenic && (
                    <FactBox icon="shield-checkmark-outline" label="Sensibilidad" value="Hipoalergénico" />
                  )}
                </View>

                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionLabel}>Ficha general</Text>
                  <Text style={styles.descriptionText}>{selectedBreed.description}</Text>
                </View>
              </ScrollView>

              <PrimaryButton
                title="Registrar atención con esta raza"
                icon="medkit-outline"
                trailingIcon={null}
                onPress={() => {
                  const chosen = selectedBreed;
                  setSelectedBreed(null);
                  navigation.navigate('CreateRequest', {
                    initialSpecies: chosen.species,
                    initialBreed: chosen.name,
                  });
                }}
              />
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function FactBox({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.factBox}>
      <View style={styles.factLabelRow}>
        <Ionicons name={icon} size={13} color={colors.primaryDark} />
        <Text style={styles.factLabel}>{label}</Text>
      </View>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topControls: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.track,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.pendingSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  cacheBannerText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.pending,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
  },
  hypoPill: {
    backgroundColor: colors.doneSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  hypoPillText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.done,
  },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  miniBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  centerText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerWrap: {
    paddingTop: spacing.xs,
    alignItems: 'center',
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
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
    gap: spacing.md,
    ...shadows.raised,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  modalPhoto: {
    width: '100%',
    height: 210,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  modalAvatarBox: {
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  factBox: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  factLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  factLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  factValue: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.text,
  },
  descriptionCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  descriptionLabel: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.primaryDark,
  },
  descriptionText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
});
