import { Injectable } from "@nestjs/common";
import { IItemRepository } from "@domain/repositories/item.repository";
import { ItemEntity } from "@domain/entities/item.entity";
import { DomainException } from "@domain/exceptions/domain.exception";
import { randomUUID } from "crypto";

export interface CreateItemInput {
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
}

@Injectable()
export class CreateItemUseCase {
  constructor(private readonly itemRepository: IItemRepository) {}

  async execute(input: CreateItemInput): Promise<ItemEntity> {
    const existing = await this.itemRepository.findBySku(input.sku);
    if (existing) {
      throw new DomainException(`Item com SKU "${input.sku}" já existe.`);
    }

    const item = new ItemEntity({
      id: randomUUID(),
      sku: input.sku,
      name: input.name,
      description: input.description,
      unitPrice: input.unitPrice,
      createdAt: new Date(),
    });

    return this.itemRepository.create(item);
  }
}
