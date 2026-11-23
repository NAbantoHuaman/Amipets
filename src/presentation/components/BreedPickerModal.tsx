import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BreedSpecies } from '../../domain/models/breed';
import {
  fetchAllDogBreedNames,
  fetchCatBreeds,
  getCachedCatBreeds,
  getCachedDogBreedNames,
} from '../../infrastructure/services/breedsApiService';
import { colors, fonts, radius, shadows, spacing } from '../theme';
import { PressableScale } from './PressableScale';
import { PrimaryButton } from './PrimaryButton';
import { SearchBar } from './SearchBar';

interface Props {
  visible: boolean;
  species: BreedSpecies;
  selectedBreed?: string;
  onSelect: (breedName: string) => void;
  onClose: () => void;
}

export function BreedPickerModal({
  visible,
  species,
  selectedBreed,
  onSelect,
  onClose,
}: Props) {
  const [breeds, setBreeds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [fromCache, setFromCache] = useState<boolean>(false);

  const loadBreeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFromCache(false);

    try {
      if (species === 'PERRO') {
        const names = await fetchAllDogBreedNames();
        setBreeds(names);
      } else {
        const catItems = await fetchCatBreeds();
        const names = ['Mestizo / Doméstico', ...catItems.map((c) => c.name)];
        setBreeds(names);
      }
    } catch (err) {
      if (species === 'PERRO') {
        const cached = await getCachedDogBreedNames();
        if (cached.length > 0) {
          setBreeds(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }
      } else {
        const cached = await getCachedCatBreeds();
        if (cached.length > 0) {
          setBreeds(['Mestizo / Doméstico', ...cached.map((c) => c.name)]);
          setFromCache(true);
          setLoading(false);
          return;
        }
      }
      setBreeds([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el listado de razas.');
    } finally {
      setLoading(false);
    }
  }, [species]);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    void loadBreeds();
  }, [visible, loadBreeds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return breeds;
    return breeds.filter((name) => name.toLowerCase().includes(q));
  }, [breeds, query]);

  const trimmedQuery = query.trim();
  const canUseCustomQuery =
    trimmedQuery.length >= 2 && !filtered.some((b) => b.toLowerCase() === trimmedQuery.toLowerCase());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {species === 'PERRO' ? 'Seleccionar raza de perro' : 'Seleccionar raza de gato'}
              </Text>
              <Text style={styles.subtitle}>
                {fromCache
                  ? 'Sin conexión · Lista guardada en el dispositivo'
                  : `${breeds.length} opciones disponibles`}
              </Text>
            </View>
            <PressableScale
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de razas"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </PressableScale>
          </View>

          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar raza (ej. Golden, Siamés, Mestizo)..."
            testID="breed-picker-search"
          />

          {canUseCustomQuery && (
            <PressableScale
              onPress={() => {
                onSelect(trimmedQuery);
                onClose();
              }}
              style={styles.customRow}
              accessibilityRole="button"
              accessibilityLabel={`Usar ${trimmedQuery}`}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.customRowText}>Usar "{trimmedQuery}"</Text>
            </PressableScale>
          )}

          {loading && breeds.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.centerText}>Cargando listado de razas...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
              <Text style={styles.centerText}>{error}</Text>
              <PrimaryButton
                title="Reintentar"
                onPress={() => void loadBreeds()}
                compact
                icon="refresh"
                trailingIcon={null}
              />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.centerBox}>
                  <Text style={styles.centerText}>
                    No encontramos razas que coincidan con "{query}".
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const selected =
                  selectedBreed?.trim().toLowerCase() === item.toLowerCase();
                return (
                  <PressableScale
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    style={[styles.itemRow, selected && styles.itemRowSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name="paw-outline"
                      size={16}
                      color={selected ? colors.primaryDark : colors.textMuted}
                    />
                    <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                      {item}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </PressableScale>
                );
              }}
            />
          )}
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    height: '80%',
    gap: spacing.sm,
    ...shadows.raised,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  customRowText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  listContent: {
    gap: 6,
    paddingVertical: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  itemTextSelected: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  centerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
