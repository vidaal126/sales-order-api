import { ItemEntity } from '@domain/entities/item.entity';

export interface IItemRepository {
  findById(id: string): Promise<ItemEntity | undefined>;
  findAll(): Promise<ItemEntity[]>;
  findBySku(sku: string): Promise<ItemEntity | undefined>;
  findByIds(ids: string[]): Promise<ItemEntity[]>;
  create(item: ItemEntity): Promise<ItemEntity>;
}
