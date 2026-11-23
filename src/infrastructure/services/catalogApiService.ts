import { ImageSourcePropType } from 'react-native';
import { OrderCategory } from '../../domain/models/order';
import { CatalogProduct, TargetSpecies } from '../../domain/models/product';

export const CATALOG_API_ENDPOINT = 'https://dummyjson.com/products?limit=24';

interface DummyJsonProduct {
  id: number;
}

interface DummyJsonResponse {
  products?: DummyJsonProduct[];
}

interface RealPetProduct {
  id: number;
  title: string;
  brand: string;
  category: OrderCategory;
  categoryLabel: string;
  price: number;
  description: string;
  stock: number;
  sku: string;
  targetSpecies: TargetSpecies;
  image: ImageSourcePropType;
}

const REAL_PERU_PRODUCTS: RealPetProduct[] = [
  {
    id: 1,
    title: 'Canbo Defense Balance Cachorro Pollo 3 kg',
    brand: 'Canbo',
    category: 'ALIMENTO',
    categoryLabel: 'Alimento',
    price: 51.0,
    description: 'Alimento seco para cachorros de razas medianas y grandes con pollo y arroz.',
    stock: 18,
    sku: 'AMP-ALI-01',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/canbo-cachorro.jpg'),
  },
  {
    id: 2,
    title: 'Royal Canin Mini Adulto 8+ (2 kg)',
    brand: 'Royal Canin',
    category: 'ALIMENTO',
    categoryLabel: 'Alimento',
    price: 83.0,
    description: 'Nutrición especializada para perros de raza pequeña mayores de 8 años.',
    stock: 14,
    sku: 'AMP-ALI-02',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/royal-canin-mini.jpg'),
  },
  {
    id: 3,
    title: "Hill's Science Diet Oral Care 1.8 kg",
    brand: "Hill's",
    category: 'ALIMENTO',
    categoryLabel: 'Alimento',
    price: 101.1,
    description: 'Croquetas clínicas diseñadas para reducir placa y sarro en perros adultos.',
    stock: 10,
    sku: 'AMP-ALI-03',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/hills-oral-care.jpg'),
  },
  {
    id: 4,
    title: 'Churu Puré Salmón con Atún (Pack x4)',
    brand: 'Inaba Churu',
    category: 'ALIMENTO',
    categoryLabel: 'Alimento',
    price: 9.9,
    description: 'Snack cremoso natural para gatos sin granos ni conservantes artificiales.',
    stock: 32,
    sku: 'AMP-ALI-04',
    targetSpecies: 'GATO',
    image: require('../../../assets/products/churu-salmon-atun.jpg'),
  },
  {
    id: 5,
    title: 'Zee.Dog Collar Nox Sidus',
    brand: 'Zee.Dog',
    category: 'ACCESORIOS',
    categoryLabel: 'Accesorios',
    price: 45.0,
    description: 'Collar de poliéster suave con hebilla de bloqueo seguro de 4 puntos.',
    stock: 16,
    sku: 'AMP-ACC-01',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/zeedog-collar-nox.jpg'),
  },
  {
    id: 6,
    title: 'Zee.Dog Pechera FlyHarness Samba',
    brand: 'Zee.Dog',
    category: 'ACCESORIOS',
    categoryLabel: 'Accesorios',
    price: 169.0,
    description: 'Arnés ergonómico ultraligero con malla respirable y cierre rápido.',
    stock: 9,
    sku: 'AMP-ACC-02',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/zeedog-arnes-samba.jpg'),
  },
  {
    id: 7,
    title: 'Zee.Dog Correa Dune Large',
    brand: 'Zee.Dog',
    category: 'ACCESORIOS',
    categoryLabel: 'Accesorios',
    price: 99.0,
    description: 'Correa resistente con mosquetón Super Hook de bloqueo giratorio.',
    stock: 12,
    sku: 'AMP-ACC-03',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/zeedog-correa-dune.jpg'),
  },
  {
    id: 8,
    title: 'Polera Sport Doggy',
    brand: 'Cat-oh',
    category: 'ROPA',
    categoryLabel: 'Ropa',
    price: 22.0,
    description: 'Polera térmica ligera con acabado deportivo para paseos diarios.',
    stock: 15,
    sku: 'AMP-ROP-01',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/polera-sport-doggy.jpg'),
  },
  {
    id: 9,
    title: 'Chaleco Antiansiedad para Perros',
    brand: 'Cat-oh',
    category: 'ROPA',
    categoryLabel: 'Ropa',
    price: 84.0,
    description: 'Chaleco de compresión suave ideal para calmar estrés o ruidos fuertes.',
    stock: 8,
    sku: 'AMP-ROP-02',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/chaleco-antiansiedad.jpg'),
  },
  {
    id: 10,
    title: 'Polera Less People More Dogs Celeste',
    brand: 'Cochikis',
    category: 'ROPA',
    categoryLabel: 'Ropa',
    price: 37.0,
    description: 'Polera de algodón suave con estampado y puños elásticos cómodos.',
    stock: 14,
    sku: 'AMP-ROP-03',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/polera-celeste.jpg'),
  },
  {
    id: 11,
    title: 'KONG Lick Spinz Talla S',
    brand: 'KONG',
    category: 'JUGUETES',
    categoryLabel: 'Juguetes',
    price: 63.0,
    description: 'Plato interactivo giratorio con texturas para premiar y relajar.',
    stock: 11,
    sku: 'AMP-JUG-01',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/kong-lick-spinz.png'),
  },
  {
    id: 12,
    title: 'Nerf Dog Pelotas de Tenis Squeak x3',
    brand: 'Nerf Dog',
    category: 'JUGUETES',
    categoryLabel: 'Juguetes',
    price: 25.0,
    description: 'Pack de 3 pelotas resistentes con sonido para juegos al aire libre.',
    stock: 22,
    sku: 'AMP-JUG-02',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/nerf-pelotas.jpg'),
  },
  {
    id: 13,
    title: "Hill's Science Diet Oral Care Gatos 1.6 kg",
    brand: "Hill's",
    category: 'ALIMENTO',
    categoryLabel: 'Alimento',
    price: 121.3,
    description: 'Alimento seco para gatos adultos que ayuda a controlar sarro y placa.',
    stock: 12,
    sku: 'AMP-ALI-05',
    targetSpecies: 'GATO',
    image: require('../../../assets/products/hills-oral-gatos.jpg'),
  },
  {
    id: 14,
    title: 'Canbo Biscuits Cordero 200 g',
    brand: 'Canbo',
    category: 'ALIMENTO',
    categoryLabel: 'Alimento',
    price: 14.5,
    description: 'Galletas horneadas con sabor a cordero para cachorros en crecimiento.',
    stock: 26,
    sku: 'AMP-ALI-06',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/canbo-biscuits.jpg'),
  },
  {
    id: 15,
    title: 'Zee.Dog Comedero Tuff Bowl Sage',
    brand: 'Zee.Dog',
    category: 'ACCESORIOS',
    categoryLabel: 'Accesorios',
    price: 139.0,
    description: 'Plato de acero inoxidable con base de silicona antideslizante.',
    stock: 13,
    sku: 'AMP-ACC-04',
    targetSpecies: 'AMBOS',
    image: require('../../../assets/products/zeedog-comedero-sage.jpg'),
  },
  {
    id: 16,
    title: 'Ferplast Plato Antiansiedad Magnus',
    brand: 'Ferplast',
    category: 'ACCESORIOS',
    categoryLabel: 'Accesorios',
    price: 38.0,
    description: 'Comedero lento diseñado para evitar atragantamientos y mejorar la digestión.',
    stock: 17,
    sku: 'AMP-ACC-05',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/ferplast-plato-magnus.png'),
  },
  {
    id: 17,
    title: 'Animal Spirit Cama Impermeable Roja',
    brand: 'Animal Spirit',
    category: 'ACCESORIOS',
    categoryLabel: 'Accesorios',
    price: 99.9,
    description: 'Cama acolchada con funda impermeable fácil de limpiar y base resistente.',
    stock: 7,
    sku: 'AMP-ACC-06',
    targetSpecies: 'AMBOS',
    image: require('../../../assets/products/cama-impermeable-roja.jpg'),
  },
  {
    id: 18,
    title: 'Chaleco Drill Army Talla 4',
    brand: 'Cat-oh',
    category: 'ROPA',
    categoryLabel: 'Ropa',
    price: 50.5,
    description: 'Chaleco resistente de drill verde oliva con broches prácticos y bolsillo.',
    stock: 10,
    sku: 'AMP-ROP-04',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/chaleco-drill-army.jpg'),
  },
  {
    id: 19,
    title: 'Polera Leopard Paws',
    brand: 'Cat-oh',
    category: 'ROPA',
    categoryLabel: 'Ropa',
    price: 22.0,
    description: 'Polera abrigadora de polar suave con diseño estampado para paseos.',
    stock: 15,
    sku: 'AMP-ROP-05',
    targetSpecies: 'AMBOS',
    image: require('../../../assets/products/polera-leopard-paws.jpg'),
  },
  {
    id: 20,
    title: 'Polera I Bark a Lot Negra',
    brand: 'Cochikis',
    category: 'ROPA',
    categoryLabel: 'Ropa',
    price: 35.0,
    description: 'Polera de algodón negro suave con estampado frontal y cuello rib.',
    stock: 13,
    sku: 'AMP-ROP-06',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/polera-negra-bark.jpg'),
  },
  {
    id: 21,
    title: 'Nylabone Nubz Mantequilla de Maní 164 g',
    brand: 'Nylabone',
    category: 'JUGUETES',
    categoryLabel: 'Juguetes',
    price: 51.0,
    description: 'Huesos masticables comestibles sabor mantequilla de maní sin alérgenos.',
    stock: 19,
    sku: 'AMP-JUG-03',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/nylabone-nubz.jpg'),
  },
  {
    id: 22,
    title: 'Hartz Duraplay Ball Tocino Grande',
    brand: 'Hartz',
    category: 'JUGUETES',
    categoryLabel: 'Juguetes',
    price: 49.9,
    description: 'Pelota suave de látex natural con aroma a tocino y sonido interno.',
    stock: 14,
    sku: 'AMP-JUG-04',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/hartz-duraplay-ball.jpg'),
  },
  {
    id: 23,
    title: 'GIGwi Pelotas de Tenis Originals x3',
    brand: 'GIGwi',
    category: 'JUGUETES',
    categoryLabel: 'Juguetes',
    price: 24.9,
    description: 'Pack de 3 pelotas de tenis de colores con fieltro seguro para dientes.',
    stock: 20,
    sku: 'AMP-JUG-05',
    targetSpecies: 'PERRO',
    image: require('../../../assets/products/gigwi-tennis-x3.jpg'),
  },
  {
    id: 24,
    title: 'KONG Pull-A-Partz Verde y Rojo',
    brand: 'KONG',
    category: 'JUGUETES',
    categoryLabel: 'Juguetes',
    price: 28.0,
    description: 'Juguete interactivo con hierba gatera y texturas para estimulación felina.',
    stock: 16,
    sku: 'AMP-JUG-06',
    targetSpecies: 'GATO',
    image: require('../../../assets/products/kong-pull-a-partz.jpg'),
  },
];

export const CATALOG_FALLBACK_ITEMS: CatalogProduct[] = REAL_PERU_PRODUCTS.map((product) => ({
  ...product,
}));

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function findCatalogProductAsset(
  productoId?: number,
  productoTitle?: string,
): CatalogProduct | undefined {
  if (typeof productoId === 'number' && !isNaN(productoId)) {
    const byId = CATALOG_FALLBACK_ITEMS.find((p) => p.id === productoId);
    if (byId) return byId;
  }

  if (productoTitle) {
    const target = normalizeTitle(productoTitle);
    const byTitle = CATALOG_FALLBACK_ITEMS.find((p) => normalizeTitle(p.title) === target);
    if (byTitle) return byTitle;
  }

  return undefined;
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(CATALOG_API_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`No se pudo cargar el catálogo (código ${response.status}).`);
    }

    const data = (await response.json()) as DummyJsonResponse;
    const items = Array.isArray(data.products) ? data.products : [];

    if (items.length === 0) {
      throw new Error('No se encontraron productos disponibles en este momento.');
    }

    return CATALOG_FALLBACK_ITEMS.map((product) => ({ ...product }));
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('La conexión tardó demasiado. Intenta nuevamente.');
    }
    if (err instanceof Error && err.message) {
      throw err;
    }
    throw new Error('No se pudo cargar el catálogo. Revisa tu conexión e intenta nuevamente.');
  } finally {
    clearTimeout(timeout);
  }
}
