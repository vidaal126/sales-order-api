import type { ItemEntity } from '@domain/entities/item.entity';
import { IItemRepository } from '@domain/repositories/item.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetItemsUseCase {
  constructor(@Inject(IItemRepository) private readonly itemRepository: IItemRepository) {}

  async execute(): Promise<ItemEntity[]> {
    return this.itemRepository.findAll();
  }
}
