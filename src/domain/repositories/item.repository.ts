import type { ItemEntity } from '@domain/entities/item.entity';
import type { PaginationParams } from '@domain/repositories/pagination';

export interface IItemRepository {
  findById(id: string): Promise<ItemEntity | undefined>;
  findAll(params?: PaginationParams): Promise<ItemEntity[]>;
  findBySku(sku: string): Promise<ItemEntity | undefined>;
  findByIds(ids: string[]): Promise<ItemEntity[]>;
  create(item: ItemEntity): Promise<ItemEntity>;
}
