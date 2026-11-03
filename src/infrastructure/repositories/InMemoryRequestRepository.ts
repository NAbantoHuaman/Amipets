import {
  DEFAULT_SERVICE_PRICES,
  RequestChanges,
  RequestInput,
  RequestStatus,
  ServicePrices,
  ServiceType,
  VeterinaryRequest,
} from '../../domain/models/request';
import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { generateId } from '../../utils/id';

const STORAGE_REQUESTS_KEY = 'amipets_requests_v1';
const STORAGE_PRICES_KEY = 'amipets_service_prices_v1';

function readStorage<T>(key: string): T | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
  } catch {
    // Fallback to memory
  }
  return null;
}

function writeStorage<T>(key: string, value: T): void {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore storage errors
  }
}

export class InMemoryRequestRepository implements IRequestRepository {
  private requests: VeterinaryRequest[] = [];
  private servicePrices: ServicePrices = { ...DEFAULT_SERVICE_PRICES };

  constructor(initialRequests: VeterinaryRequest[] = []) {
    const persistedRequests = readStorage<VeterinaryRequest[]>(STORAGE_REQUESTS_KEY);
    this.requests = Array.isArray(persistedRequests) ? persistedRequests : [...initialRequests];

    const persistedPrices = readStorage<ServicePrices>(STORAGE_PRICES_KEY);
    if (persistedPrices && typeof persistedPrices === 'object') {
      this.servicePrices = { ...DEFAULT_SERVICE_PRICES, ...persistedPrices };
    }
  }

  getAllSync(): VeterinaryRequest[] {
    return [...this.requests];
  }

  saveAllSync(requests: VeterinaryRequest[]): void {
    this.requests = [...requests];
    writeStorage(STORAGE_REQUESTS_KEY, this.requests);
  }

  getServicePrices(): ServicePrices {
    return { ...this.servicePrices };
  }

  updateServicePrice(service: ServiceType, price: number): ServicePrices {
    this.servicePrices = {
      ...this.servicePrices,
      [service]: price,
    };
    writeStorage(STORAGE_PRICES_KEY, this.servicePrices);
    return { ...this.servicePrices };
  }

  async getAll(): Promise<VeterinaryRequest[]> {
    return [...this.requests];
  }

  async getById(id: string): Promise<VeterinaryRequest | undefined> {
    return this.requests.find((r) => r.id === id);
  }

  async create(input: RequestInput): Promise<VeterinaryRequest> {
    const newRequest: VeterinaryRequest = {
      ...input,
      id: generateId(),
      estado: 'PENDIENTE',
      fechaRegistro: input.fechaRegistro ?? new Date().toISOString(),
    };
    this.requests.unshift(newRequest);
    writeStorage(STORAGE_REQUESTS_KEY, this.requests);
    return newRequest;
  }

  async update(id: string, changes: RequestChanges): Promise<VeterinaryRequest> {
    const index = this.requests.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Solicitud con ID ${id} no encontrada.`);
    }
    const updated: VeterinaryRequest = {
      ...this.requests[index],
      ...changes,
      id: this.requests[index].id,
      fechaRegistro: changes.fechaRegistro ?? this.requests[index].fechaRegistro,
    };
    this.requests[index] = updated;
    writeStorage(STORAGE_REQUESTS_KEY, this.requests);
    return updated;
  }

  async changeStatus(id: string, status: RequestStatus): Promise<VeterinaryRequest> {
    return this.update(id, { estado: status } as RequestChanges);
  }

  async delete(id: string): Promise<boolean> {
    const prevLen = this.requests.length;
    this.requests = this.requests.filter((r) => r.id !== id);
    writeStorage(STORAGE_REQUESTS_KEY, this.requests);
    return this.requests.length < prevLen;
  }

  async resetDemo(): Promise<VeterinaryRequest[]> {
    this.requests = [];
    writeStorage(STORAGE_REQUESTS_KEY, this.requests);
    return [];
  }

  async clearAll(): Promise<void> {
    this.requests = [];
    writeStorage(STORAGE_REQUESTS_KEY, this.requests);
  }
}

export const requestRepository = new InMemoryRequestRepository();
