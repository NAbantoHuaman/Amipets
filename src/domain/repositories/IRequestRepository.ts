import { RequestChanges, RequestInput, RequestStatus, ServicePrices, ServiceType, VeterinaryRequest } from '../models/request';

export interface IRequestRepository {
  getAll(): Promise<VeterinaryRequest[]>;
  getById(id: string): Promise<VeterinaryRequest | undefined>;
  create(input: RequestInput): Promise<VeterinaryRequest>;
  update(id: string, changes: RequestChanges): Promise<VeterinaryRequest>;
  changeStatus(id: string, status: RequestStatus): Promise<VeterinaryRequest>;
  delete(id: string): Promise<boolean>;
  resetDemo(): Promise<VeterinaryRequest[]>;
  clearAll(): Promise<void>;
  getServicePrices(): ServicePrices;
  updateServicePrice(service: ServiceType, price: number): ServicePrices;
}
