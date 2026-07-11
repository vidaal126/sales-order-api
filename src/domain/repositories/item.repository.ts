import type { ItemEntity } from '@domain/entities/item.entity';
import type { PaginationParams } from '@domain/repositories/pagination';

export abstract class IItemRepository {
  abstract findById(id: string): Promise<ItemEntity | undefined>;
  abstract findAll(params?: PaginationParams): Promise<ItemEntity[]>;
  abstract findBySku(sku: string): Promise<ItemEntity | undefined>;
  abstract findByIds(ids: string[]): Promise<ItemEntity[]>;
  abstract create(item: ItemEntity): Promise<ItemEntity>;
}
