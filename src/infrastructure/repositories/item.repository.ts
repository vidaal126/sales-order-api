import { ItemEntity } from '@domain/entities/item.entity';
import { IItemRepository } from '@domain/repositories/item.repository';
import { type PaginationParams, resolvePageSize } from '@domain/repositories/pagination';
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../database/generated/client';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class ItemRepository extends IItemRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<ItemEntity | undefined> {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) return undefined;
    return new ItemEntity({
      id: item.id,
      sku: item.sku,
      name: item.name,
      description: item.description ?? undefined,
      unitPrice: Number(item.unitPrice),
      createdAt: item.createdAt,
    });
  }

  async findBySku(sku: string): Promise<ItemEntity | undefined> {
    const item = await this.prisma.item.findUnique({ where: { sku } });
    if (!item) return undefined;
    return new ItemEntity({
      id: item.id,
      sku: item.sku,
      name: item.name,
      description: item.description ?? undefined,
      unitPrice: Number(item.unitPrice),
      createdAt: item.createdAt,
    });
  }

  async findAll(params?: PaginationParams): Promise<ItemEntity[]> {
    const limit = resolvePageSize(params?.limit);
    const page = params?.page ?? 1;
    const items = await this.prisma.item.findMany({
      take: limit,
      skip: (page - 1) * limit,
    });
    return items.map(
      (i): ItemEntity =>
        new ItemEntity({
          id: i.id,
          sku: i.sku,
          name: i.name,
          description: i.description ?? undefined,
          unitPrice: Number(i.unitPrice),
          createdAt: i.createdAt,
        }),
    );
  }

  async findByIds(ids: string[], tx?: unknown): Promise<ItemEntity[]> {
    const client = (tx as Prisma.TransactionClient) ?? this.prisma;
    const items = await client.item.findMany({ where: { id: { in: ids } } });
    return items.map(
      (i): ItemEntity =>
        new ItemEntity({
          id: i.id,
          sku: i.sku,
          name: i.name,
          description: i.description ?? undefined,
          unitPrice: Number(i.unitPrice),
          createdAt: i.createdAt,
        }),
    );
  }

  async create(item: ItemEntity): Promise<ItemEntity> {
    const created = await this.prisma.item.create({
      data: {
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        unitPrice: item.unitPrice,
      },
    });
    return new ItemEntity({
      id: created.id,
      sku: created.sku,
      name: created.name,
      description: created.description ?? undefined,
      unitPrice: Number(created.unitPrice),
      createdAt: created.createdAt,
    });
  }
}
