import { Injectable } from "@nestjs/common";
import type { IItemRepository } from "@domain/repositories/item.repository";
import { ItemEntity } from "@domain/entities/item.entity";

@Injectable()
export class GetItemsUseCase {
  constructor(private readonly itemRepository: IItemRepository) {}

  async execute(): Promise<ItemEntity[]> {
    return this.itemRepository.findAll();
  }
}
