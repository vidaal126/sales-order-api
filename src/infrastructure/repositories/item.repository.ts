import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { IItemRepository } from '@domain/repositories/item.repository';
import { ItemEntity } from '@domain/entities/item.entity';

@Injectable()
export class ItemRepository implements IItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ItemEntity | undefined> {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) return undefined;
    return new ItemEntity({ id: item.id, sku: item.sku, name: item.name, description: item.description ?? undefined, unitPrice: Number(item.unitPrice), createdAt: item.createdAt });
  }

  async findBySku(sku: string): Promise<ItemEntity | undefined> {
    const item = await this.prisma.item.findUnique({ where: { sku } });
    if (!item) return undefined;
    return new ItemEntity({ id: item.id, sku: item.sku, name: item.name, description: item.description ?? undefined, unitPrice: Number(item.unitPrice), createdAt: item.createdAt });
  }

  async findAll(): Promise<ItemEntity[]> {
    const items = await this.prisma.item.findMany();
    return items.map((i): ItemEntity => new ItemEntity({ id: i.id, sku: i.sku, name: i.name, description: i.description ?? undefined, unitPrice: Number(i.unitPrice), createdAt: i.createdAt }));
  }

  async findByIds(ids: string[]): Promise<ItemEntity[]> {
    const items = await this.prisma.item.findMany({ where: { id: { in: ids } } });
    return items.map((i): ItemEntity => new ItemEntity({ id: i.id, sku: i.sku, name: i.name, description: i.description ?? undefined, unitPrice: Number(i.unitPrice), createdAt: i.createdAt }));
  }

  async create(item: ItemEntity): Promise<ItemEntity> {
    const created = await this.prisma.item.create({
      data: { id: item.id, sku: item.sku, name: item.name, description: item.description, unitPrice: item.unitPrice },
    });
    return new ItemEntity({ id: created.id, sku: created.sku, name: created.name, description: created.description ?? undefined, unitPrice: Number(created.unitPrice), createdAt: created.createdAt });
  }
}
