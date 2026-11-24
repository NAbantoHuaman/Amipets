import {
  RequestChanges,
  RequestInput,
  RequestStatus,
  VeterinaryRequest,
} from '../models/request';

export interface IRequestRepository {
  getAll(userId?: string): Promise<VeterinaryRequest[]>;
  getPendingSync(userId: string): Promise<VeterinaryRequest[]>;
  getById(id: string): Promise<VeterinaryRequest | undefined>;
  create(input: RequestInput): Promise<VeterinaryRequest>;
  update(id: string, changes: RequestChanges): Promise<VeterinaryRequest>;
  changeStatus(id: string, status: RequestStatus): Promise<VeterinaryRequest>;
  markSynced(id: string, syncedAt: string): Promise<void>;
  upsertFromRemote(request: VeterinaryRequest): Promise<void>;
  delete(id: string): Promise<boolean>;
  hardDelete(id: string): Promise<boolean>;
  clearAll(userId?: string): Promise<void>;
}
