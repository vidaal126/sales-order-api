import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import { ISchedulingRepository } from '@domain/repositories/scheduling.repository';
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../database/generated/client';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class SchedulingRepository extends ISchedulingRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findBySalesOrderId(
    salesOrderId: string,
    tx?: unknown,
  ): Promise<SchedulingEntity | undefined> {
    const client = (tx as Prisma.TransactionClient) ?? this.prisma;
    const scheduling = await client.scheduling.findUnique({ where: { salesOrderId } });
    if (!scheduling) return undefined;
    return new SchedulingEntity({
      id: scheduling.id,
      salesOrderId: scheduling.salesOrderId,
      deliveryDate: scheduling.deliveryDate,
      windowStart: scheduling.windowStart,
      windowEnd: scheduling.windowEnd,
      confirmedAt: scheduling.confirmedAt ?? undefined,
      rescheduledAt: scheduling.rescheduledAt ?? undefined,
      createdAt: scheduling.createdAt,
      updatedAt: scheduling.updatedAt,
    });
  }

  async create(scheduling: SchedulingEntity, tx?: unknown): Promise<SchedulingEntity> {
    const client = (tx as Prisma.TransactionClient) ?? this.prisma;
    const created = await client.scheduling.create({
      data: {
        id: scheduling.id,
        salesOrderId: scheduling.salesOrderId,
        deliveryDate: scheduling.deliveryDate,
        windowStart: scheduling.windowStart,
        windowEnd: scheduling.windowEnd,
        confirmedAt: scheduling.confirmedAt,
        rescheduledAt: scheduling.rescheduledAt,
      },
    });
    return new SchedulingEntity({
      id: created.id,
      salesOrderId: created.salesOrderId,
      deliveryDate: created.deliveryDate,
      windowStart: created.windowStart,
      windowEnd: created.windowEnd,
      confirmedAt: created.confirmedAt ?? undefined,
      rescheduledAt: created.rescheduledAt ?? undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async update(scheduling: SchedulingEntity, tx?: unknown): Promise<SchedulingEntity> {
    const client = (tx as Prisma.TransactionClient) ?? this.prisma;
    const updated = await client.scheduling.update({
      where: { salesOrderId: scheduling.salesOrderId },
      data: {
        deliveryDate: scheduling.deliveryDate,
        windowStart: scheduling.windowStart,
        windowEnd: scheduling.windowEnd,
        confirmedAt: scheduling.confirmedAt,
        rescheduledAt: scheduling.rescheduledAt,
      },
    });
    return new SchedulingEntity({
      id: updated.id,
      salesOrderId: updated.salesOrderId,
      deliveryDate: updated.deliveryDate,
      windowStart: updated.windowStart,
      windowEnd: updated.windowEnd,
      confirmedAt: updated.confirmedAt ?? undefined,
      rescheduledAt: updated.rescheduledAt ?? undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  }
}
