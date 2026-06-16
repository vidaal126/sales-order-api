import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { ISalesOrderRepository, SalesOrderFilters } from '@domain/repositories/sales-order.repository';
import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { Prisma } from '../database/generated/client';

type SalesOrderWithRelations = Prisma.SalesOrderGetPayload<{
  include: { items: true; scheduling: true };
}>;

@Injectable()
export class SalesOrderRepository implements ISalesOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: SalesOrderWithRelations): SalesOrderEntity {
    return new SalesOrderEntity({
      id: raw.id,
      customerId: raw.customerId,
      transportTypeId: raw.transportTypeId,
      status: raw.status as OrderStatus,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      items: raw.items.map((item: SalesOrderWithRelations['items'][number]): SalesOrderItemEntity =>
        new SalesOrderItemEntity({ itemId: item.itemId, quantity: item.quantity, unitPrice: Number(item.unitPrice) }),
      ),
      scheduling: raw.scheduling ? new SchedulingEntity({
        id: raw.scheduling.id,
        salesOrderId: raw.scheduling.salesOrderId,
        deliveryDate: raw.scheduling.deliveryDate,
        windowStart: raw.scheduling.windowStart,
        windowEnd: raw.scheduling.windowEnd,
        confirmedAt: raw.scheduling.confirmedAt ?? undefined,
        rescheduledAt: raw.scheduling.rescheduledAt ?? undefined,
        createdAt: raw.scheduling.createdAt,
        updatedAt: raw.scheduling.updatedAt,
      }) : undefined,
    });
  }

  async findById(id: string): Promise<SalesOrderEntity | undefined> {
    const order = await this.prisma.salesOrder.findUnique({ where: { id }, include: { items: true, scheduling: true } });
    if (!order) return undefined;
    return this.toDomain(order);
  }

  async findAll(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]> {
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
    });
    return orders.map((order): SalesOrderEntity => this.toDomain(order));
  }

  async create(order: SalesOrderEntity): Promise<SalesOrderEntity> {
    const created = await this.prisma.salesOrder.create({
      data: {
        id: order.id,
        customerId: order.customerId,
        transportTypeId: order.transportTypeId,
        status: order.status,
        notes: order.notes,
        items: { create: order.items.map((item): { itemId: string; quantity: number; unitPrice: number } => ({ itemId: item.itemId, quantity: item.quantity, unitPrice: item.unitPrice })) },
      },
      include: { items: true, scheduling: true },
    });
    return this.toDomain(created);
  }

  async update(order: SalesOrderEntity): Promise<SalesOrderEntity> {
    const updated = await this.prisma.salesOrder.update({
      where: { id: order.id },
      data: { status: order.status, notes: order.notes, transportTypeId: order.transportTypeId },
      include: { items: true, scheduling: true },
    });
    return this.toDomain(updated);
  }
}
