export type BreedSpecies = 'PERRO' | 'GATO';

export interface PetBreed {
  id: string;
  species: BreedSpecies;
  name: string;
  origin?: string;
  coat?: string;
  pattern?: string;
  lifeSpan?: string;
  weightRange?: string;
  hypoallergenic?: boolean;
  energyLevel?: number;
  groomingLevel?: number;
  exerciseMinutes?: number;
  description: string;
  imageUrl?: string;
}

export interface DogBreedsPageResult {
  items: PetBreed[];
  page: number;
  nextPage: number | null;
  fromCache?: boolean;
}
