import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { ISchedulingRepository } from '@domain/repositories/scheduling.repository';
import { SchedulingEntity } from '@domain/entities/scheduling.entity';

@Injectable()
export class SchedulingRepository extends ISchedulingRepository {
  constructor(private readonly prisma: PrismaService) { super(); }

  async findBySalesOrderId(salesOrderId: string): Promise<SchedulingEntity | undefined> {
    const scheduling = await this.prisma.scheduling.findUnique({ where: { salesOrderId } });
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

  async create(scheduling: SchedulingEntity): Promise<SchedulingEntity> {
    const created = await this.prisma.scheduling.create({
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

  async update(scheduling: SchedulingEntity): Promise<SchedulingEntity> {
    const updated = await this.prisma.scheduling.update({
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
