import type { ItemEntity } from '@domain/entities/item.entity';
import type { IItemRepository } from '@domain/repositories/item.repository';
import type { PaginationParams } from '@domain/repositories/pagination';
import { ITEM_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetItemsUseCase {
  constructor(@Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository) {}

  async execute(params?: PaginationParams): Promise<ItemEntity[]> {
    return this.itemRepository.findAll(params);
  }
}
