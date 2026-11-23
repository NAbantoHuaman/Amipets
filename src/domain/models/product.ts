import { ImageSourcePropType } from 'react-native';
import { OrderCategory } from './order';

export type TargetSpecies = 'PERRO' | 'GATO' | 'AMBOS';

export interface CatalogProduct {
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
