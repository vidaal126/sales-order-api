import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import type { ISchedulingRepository } from '@domain/repositories/scheduling.repository';
import {
  EVENT_EMITTER,
  SALES_ORDER_REPOSITORY,
  SCHEDULING_REPOSITORY,
  UNIT_OF_WORK,
} from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

export interface RescheduleDeliveryInput {
  salesOrderId: string;
  deliveryDate: Date;
  windowStart: Date;
  windowEnd: Date;
}

@Injectable()
export class RescheduleDeliveryUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: ISalesOrderRepository,
    @Inject(SCHEDULING_REPOSITORY)
    private readonly schedulingRepository: ISchedulingRepository,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: IEventEmitter,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(input: RescheduleDeliveryInput): Promise<SchedulingEntity> {
    interface RescheduleResult {
      saved: SchedulingEntity;
      previousDate: Date;
    }

    const { saved, previousDate } = await this.unitOfWork.execute(
      async (tx): Promise<RescheduleResult> => {
        const order = await this.salesOrderRepository.findById(input.salesOrderId, tx);
        if (!order) {
          throw new DomainNotFoundException(`Ordem de venda ${input.salesOrderId} não encontrada.`);
        }

        if (order.status !== OrderStatus.AGENDADA) {
          throw new DomainException(
            `Só é possível reagendar ordens no status AGENDADA. Status atual: ${order.status}.`,
          );
        }

        const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId, tx);
        if (!existing) {
          throw new DomainNotFoundException(
            `Agendamento para ordem ${input.salesOrderId} não encontrado.`,
          );
        }

        SchedulingEntity.validateWindow({
          deliveryDate: input.deliveryDate,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd,
        });

        const updated = new SchedulingEntity({
          id: existing.id,
          salesOrderId: existing.salesOrderId,
          deliveryDate: input.deliveryDate,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd,
          confirmedAt: existing.confirmedAt,
          rescheduledAt: new Date(),
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        });

        const saved = await this.schedulingRepository.update(updated, tx);
        return { saved, previousDate: existing.deliveryDate };
      },
    );

    this.eventEmitter.emit('order.delivery.rescheduled', {
      orderId: input.salesOrderId,
      previousDate,
      newDate: saved.deliveryDate,
    });

    return saved;
  }
}
