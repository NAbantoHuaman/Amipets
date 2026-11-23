import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../../application/utils/id';
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

const STORAGE_REQUESTS_KEY = 'amipets_requests_v1';
const STORAGE_PRICES_KEY = 'amipets_service_prices_v1';

export class InMemoryRequestRepository implements IRequestRepository {
  private requests: VeterinaryRequest[] = [];
  private servicePrices: ServicePrices = { ...DEFAULT_SERVICE_PRICES };

  constructor(initialRequests: VeterinaryRequest[] = []) {
    this.requests = [...initialRequests];
  }

  async loadPersistedRequests(): Promise<VeterinaryRequest[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_REQUESTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.requests = parsed as VeterinaryRequest[];
        }
      }
    } catch {
      // Ignore AsyncStorage read errors
    }
    return [...this.requests];
  }

  async saveRequestsAsync(requests: VeterinaryRequest[]): Promise<void> {
    this.requests = [...requests];
    try {
      await AsyncStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(this.requests));
    } catch {
      // Ignore AsyncStorage write errors
    }
  }

  async loadPersistedServicePrices(): Promise<ServicePrices> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_PRICES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.servicePrices = { ...DEFAULT_SERVICE_PRICES, ...parsed };
        }
      }
    } catch {
      // Ignore AsyncStorage read errors
    }
    return { ...this.servicePrices };
  }

  async saveServicePricesAsync(prices: ServicePrices): Promise<void> {
    this.servicePrices = { ...prices };
    try {
      await AsyncStorage.setItem(STORAGE_PRICES_KEY, JSON.stringify(this.servicePrices));
    } catch {
      // Ignore AsyncStorage write errors
    }
  }

  getAllSync(): VeterinaryRequest[] {
    return [...this.requests];
  }

  saveAllSync(requests: VeterinaryRequest[]): void {
    void this.saveRequestsAsync(requests);
  }

  getServicePrices(): ServicePrices {
    return { ...this.servicePrices };
  }

  updateServicePrice(service: ServiceType, price: number): ServicePrices {
    this.servicePrices = {
      ...this.servicePrices,
      [service]: price,
    };
    void this.saveServicePricesAsync(this.servicePrices);
    return { ...this.servicePrices };
  }

  async getAll(): Promise<VeterinaryRequest[]> {
    return this.loadPersistedRequests();
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
    await this.saveRequestsAsync(this.requests);
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
    await this.saveRequestsAsync(this.requests);
    return updated;
  }

  async changeStatus(id: string, status: RequestStatus): Promise<VeterinaryRequest> {
    return this.update(id, { estado: status } as RequestChanges);
  }

  async delete(id: string): Promise<boolean> {
    const prevLen = this.requests.length;
    this.requests = this.requests.filter((r) => r.id !== id);
    await this.saveRequestsAsync(this.requests);
    return this.requests.length < prevLen;
  }

  async resetDemo(): Promise<VeterinaryRequest[]> {
    this.requests = [];
    await this.saveRequestsAsync(this.requests);
    return [];
  }

  async clearAll(): Promise<void> {
    this.requests = [];
    await this.saveRequestsAsync(this.requests);
  }
}

export const requestRepository = new InMemoryRequestRepository();
