import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import type { OrderStatus } from '@domain/enums/order-status.enum';
import type { TransactionContext } from '@domain/ports/unit-of-work.port';
import { resolvePageSize } from '@domain/repositories/pagination';
import {
  ISalesOrderRepository,
  type SalesOrderFilters,
} from '@domain/repositories/sales-order.repository';
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../database/generated/client';
import { PrismaService } from '../database/prisma/prisma.service';

type SalesOrderWithRelations = Prisma.SalesOrderGetPayload<{
  include: { items: true; scheduling: true };
}>;

@Injectable()
export class SalesOrderRepository implements ISalesOrderRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private toDomain(raw: SalesOrderWithRelations): SalesOrderEntity {
    return new SalesOrderEntity({
      id: raw.id,
      customerId: raw.customerId,
      transportTypeId: raw.transportTypeId,
      status: raw.status as OrderStatus,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      items: raw.items.map(
        (item: SalesOrderWithRelations['items'][number]): SalesOrderItemEntity =>
          new SalesOrderItemEntity({
            id: item.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          }),
      ),
      scheduling: raw.scheduling
        ? new SchedulingEntity({
            id: raw.scheduling.id,
            salesOrderId: raw.scheduling.salesOrderId,
            deliveryDate: raw.scheduling.deliveryDate,
            windowStart: raw.scheduling.windowStart,
            windowEnd: raw.scheduling.windowEnd,
            confirmedAt: raw.scheduling.confirmedAt ?? undefined,
            rescheduledAt: raw.scheduling.rescheduledAt ?? undefined,
            createdAt: raw.scheduling.createdAt,
            updatedAt: raw.scheduling.updatedAt,
          })
        : undefined,
    });
  }

  async findById(
    id: string,
    transaction?: TransactionContext,
  ): Promise<SalesOrderEntity | undefined> {
    const client = (transaction as Prisma.TransactionClient) ?? this.prisma;
    const order = await client.salesOrder.findUnique({
      where: { id },
      include: { items: true, scheduling: true },
    });
    if (!order) return undefined;
    return this.toDomain(order);
  }

  async findAll(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]> {
    const limit = resolvePageSize(filters?.limit);
    const page = filters?.page ?? 1;
    const orders = await this.prisma.salesOrder.findMany({
      where: {
        status: filters?.status,
        customerId: filters?.customerId,
        transportTypeId: filters?.transportTypeId,
        createdAt: { gte: filters?.dateFrom, lte: filters?.dateTo },
        items: filters?.itemId ? { some: { itemId: filters.itemId } } : undefined,
      },
      include: { items: true, scheduling: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return orders.map((order): SalesOrderEntity => this.toDomain(order));
  }

  async create(
    order: SalesOrderEntity,
    transaction?: TransactionContext,
  ): Promise<SalesOrderEntity> {
    const client = (transaction as Prisma.TransactionClient) ?? this.prisma;
    const created = await client.salesOrder.create({
      data: {
        id: order.id,
        customerId: order.customerId,
        transportTypeId: order.transportTypeId,
        status: order.status,
        notes: order.notes,
        items: {
          create: order.items.map(
            (item): { itemId: string; quantity: number; unitPrice: number } => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            }),
          ),
        },
      },
      include: { items: true, scheduling: true },
    });
    return this.toDomain(created);
  }

  async update(
    order: SalesOrderEntity,
    transaction?: TransactionContext,
  ): Promise<SalesOrderEntity> {
    const client = (transaction as Prisma.TransactionClient) ?? this.prisma;
    const updated = await client.salesOrder.update({
      where: { id: order.id },
      data: {
        status: order.status,
        notes: order.notes,
        transportTypeId: order.transportTypeId,
      },
      include: { items: true, scheduling: true },
    });
    return this.toDomain(updated);
  }
}
