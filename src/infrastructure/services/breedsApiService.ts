import AsyncStorage from '@react-native-async-storage/async-storage';
import { DogBreedsPageResult, PetBreed } from '../../domain/models/breed';

const DOG_BREEDS_CACHE_KEY = 'amipets_dog_breeds_page1_v1';
const DOG_NAMES_CACHE_KEY = 'amipets_dog_breed_names_v1';
const CAT_BREEDS_CACHE_KEY = 'amipets_cat_breeds_v1';
const REQUEST_TIMEOUT_MS = 12_000;

interface DogApiV2Image {
  url?: string;
  thumb?: string;
  medium?: string;
}

interface DogApiV2Item {
  id: string;
  attributes?: {
    name?: string;
    description?: string;
    life?: { min?: number; max?: number };
    male_weight?: { min?: number; max?: number };
    female_weight?: { min?: number; max?: number };
    hypoallergenic?: boolean;
    origin?: { country?: string; region?: string };
    coat?: { type?: string; length?: string };
    traits?: {
      energy?: number;
      grooming?: number;
      exercise_minutes?: number;
    };
    images?: DogApiV2Image[];
  };
}

interface DogApiV2Response {
  data?: DogApiV2Item[];
  meta?: {
    pagination?: {
      current?: number;
      next?: number | null;
    };
  };
}

interface DogCeoListResponse {
  message?: Record<string, string[]>;
}

interface CatFactBreedItem {
  breed?: string;
  country?: string;
  origin?: string;
  coat?: string;
  pattern?: string;
}

interface CatFactBreedsResponse {
  data?: CatFactBreedItem[];
}

function translateCoatType(type?: string, length?: string): string | undefined {
  const typeMap: Record<string, string> = {
    smooth: 'liso',
    wire: 'duro',
    curly: 'rizado',
    double: 'doble capa',
    wavy: 'ondulado',
    corded: 'acordonado',
    hairless: 'sin pelo',
    silky: 'sedoso',
  };
  const lengthMap: Record<string, string> = {
    short: 'corto',
    medium: 'medio',
    long: 'largo',
  };
  const parts: string[] = [];
  if (length) parts.push(lengthMap[length.toLowerCase()] ?? length);
  if (type) parts.push(typeMap[type.toLowerCase()] ?? type);
  if (parts.length === 0) return undefined;
  const joined = parts.join(' · ');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

function formatWeightRange(
  female?: { min?: number; max?: number },
  male?: { min?: number; max?: number },
): string | undefined {
  const mins = [female?.min, male?.min].filter((n): n is number => typeof n === 'number');
  const maxs = [female?.max, male?.max].filter((n): n is number => typeof n === 'number');
  if (mins.length === 0 || maxs.length === 0) return undefined;
  const minW = Math.min(...mins);
  const maxW = Math.max(...maxs);
  return minW === maxW ? `${minW} kg` : `${minW}-${maxW} kg`;
}

function capitalizeWords(text: string): string {
  return text
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getCachedDogBreeds(): Promise<PetBreed[]> {
  try {
    const raw = await AsyncStorage.getItem(DOG_BREEDS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PetBreed[]) : [];
  } catch {
    return [];
  }
}

export async function getCachedDogBreedNames(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DOG_NAMES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function getCachedCatBreeds(): Promise<PetBreed[]> {
  try {
    const raw = await AsyncStorage.getItem(CAT_BREEDS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PetBreed[]) : [];
  } catch {
    return [];
  }
}

export async function fetchDogBreedsPage(page = 1, pageSize = 30): Promise<DogBreedsPageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://dogapi.dog/api/v2/breeds?page[number]=${page}&page[size]=${pageSize}`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`No se pudo cargar la guía de razas caninas (código ${response.status}).`);
    }

    const payload = (await response.json()) as DogApiV2Response;
    const rawItems = Array.isArray(payload.data) ? payload.data : [];

    const items: PetBreed[] = rawItems.map((item) => {
      const attr = item.attributes ?? {};
      const lifeMin = attr.life?.min;
      const lifeMax = attr.life?.max;
      const lifeSpan =
        typeof lifeMin === 'number' && typeof lifeMax === 'number'
          ? `${lifeMin}-${lifeMax} años`
          : undefined;
      const firstImage = attr.images?.[0];

      return {
        id: `dog-${item.id}`,
        species: 'PERRO',
        name: attr.name?.trim() || 'Raza sin nombre',
        origin: attr.origin?.country || attr.origin?.region || undefined,
        coat: translateCoatType(attr.coat?.type, attr.coat?.length),
        lifeSpan,
        weightRange: formatWeightRange(attr.female_weight, attr.male_weight),
        hypoallergenic: Boolean(attr.hypoallergenic),
        energyLevel: attr.traits?.energy,
        groomingLevel: attr.traits?.grooming,
        exerciseMinutes: attr.traits?.exercise_minutes,
        description:
          attr.description?.trim() ||
          'Raza canina registrada en guía clínica. Evalúa peso, pelaje y actividad física en consulta.',
        imageUrl: firstImage?.medium ?? firstImage?.thumb ?? firstImage?.url,
      };
    });

    if (page === 1 && items.length > 0) {
      await AsyncStorage.setItem(DOG_BREEDS_CACHE_KEY, JSON.stringify(items)).catch(() => {});
    }

    const nextPage =
      payload.meta?.pagination?.next !== undefined
        ? payload.meta.pagination.next
        : items.length === pageSize
          ? page + 1
          : null;

    return { items, page, nextPage, fromCache: false };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al consultar razas de perros.');
    }
    throw error instanceof Error ? error : new Error('Error al cargar razas de perros.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAllDogBreedNames(): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://dog.ceo/api/breeds/list/all', {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`No se pudo consultar el listado de razas (código ${response.status}).`);
    }

    const payload = (await response.json()) as DogCeoListResponse;
    const map = payload.message ?? {};
    const namesSet = new Set<string>();

    Object.entries(map).forEach(([breed, subBreeds]) => {
      const mainLabel = capitalizeWords(breed);
      if (Array.isArray(subBreeds) && subBreeds.length > 0) {
        subBreeds.forEach((sub) => {
          namesSet.add(`${capitalizeWords(sub)} ${mainLabel}`);
        });
      } else {
        namesSet.add(mainLabel);
      }
    });

    const sorted = Array.from(namesSet).sort((a, b) => a.localeCompare(b, 'es'));
    const result = ['Mestizo / Criollo', ...sorted];

    await AsyncStorage.setItem(DOG_NAMES_CACHE_KEY, JSON.stringify(result)).catch(() => {});
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al cargar razas.');
    }
    throw error instanceof Error ? error : new Error('Error al cargar listado de razas.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCatBreeds(): Promise<PetBreed[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://catfact.ninja/breeds?limit=100', {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`No se pudo cargar la guía de razas felinas (código ${response.status}).`);
    }

    const payload = (await response.json()) as CatFactBreedsResponse;
    const rawItems = Array.isArray(payload.data) ? payload.data : [];

    const items: PetBreed[] = rawItems
      .filter((item) => Boolean(item.breed?.trim()))
      .map((item, idx) => {
        const name = item.breed!.trim();
        const origin = item.country?.trim() || item.origin?.trim() || 'Origen diverso';
        const coat = item.coat?.trim() || 'Corto / Medio';
        const pattern = item.pattern?.trim() || 'Variado';

        return {
          id: `cat-${idx}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          species: 'GATO' as const,
          name,
          origin,
          coat,
          pattern,
          description: `Raza felina asociada a ${origin}. Presenta pelaje ${coat.toLowerCase()} con patrón ${pattern.toLowerCase()}.`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    if (items.length > 0) {
      await AsyncStorage.setItem(CAT_BREEDS_CACHE_KEY, JSON.stringify(items)).catch(() => {});
    }

    return items;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al consultar razas de gatos.');
    }
    throw error instanceof Error ? error : new Error('Error al cargar razas de gatos.');
  } finally {
    clearTimeout(timeout);
  }
}
