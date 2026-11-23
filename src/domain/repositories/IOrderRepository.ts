import { OrderChanges, OrderInput, OrderStatus, PetOrder } from '../models/order';

export interface IOrderRepository {
  getAll(userId?: string): Promise<PetOrder[]>;
  getPendingSync(userId: string): Promise<PetOrder[]>;
  getById(id: string): Promise<PetOrder | undefined>;
  create(input: OrderInput): Promise<PetOrder>;
  update(id: string, changes: OrderChanges): Promise<PetOrder>;
  changeStatus(id: string, status: OrderStatus): Promise<PetOrder>;
  markSynced(id: string, syncedAt: string, comprobanteUrl?: string): Promise<void>;
  upsertFromRemote(order: PetOrder): Promise<void>;
  delete(id: string): Promise<boolean>;
  hardDelete(id: string): Promise<boolean>;
  clearAll(userId?: string): Promise<void>;
}
