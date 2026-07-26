import { randomUUID } from 'node:crypto';
import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { EVENT_EMITTER_PORT } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { ISchedulingRepository } from '@domain/repositories/scheduling.repository';
import { DomainNotFoundException } from '@infrastructure/http/exceptions/not-found.exception';
import { Inject, Injectable } from '@nestjs/common';

export interface ScheduleDeliveryInput {
  salesOrderId: string;
  deliveryDate: Date;
  windowStart: Date;
  windowEnd: Date;
}

@Injectable()
export class ScheduleDeliveryUseCase {
  constructor(
    @Inject(ISalesOrderRepository)
    private readonly salesOrderRepository: ISalesOrderRepository,
    @Inject(ISchedulingRepository)
    private readonly schedulingRepository: ISchedulingRepository,
    @Inject(EVENT_EMITTER_PORT)
    private readonly eventEmitter: IEventEmitter,
    @Inject(IUnitOfWork)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(input: ScheduleDeliveryInput): Promise<SchedulingEntity> {
    const created = await this.unitOfWork.execute(async (tx): Promise<SchedulingEntity> => {
      const order = await this.salesOrderRepository.findById(input.salesOrderId, tx);
      if (!order) {
        throw new DomainNotFoundException(`Ordem de venda ${input.salesOrderId} não encontrada.`);
      }

      if (!order.canTransitionTo(OrderStatus.AGENDADA)) {
        throw new DomainException(
          `Ordem de venda não pode ser agendada no status atual: ${order.status}.`,
        );
      }

      const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId, tx);
      if (existing) {
        throw new DomainException(`Ordem de venda ${input.salesOrderId} já possui agendamento.`);
      }

      SchedulingEntity.validateWindow({
        deliveryDate: input.deliveryDate,
        windowStart: input.windowStart,
        windowEnd: input.windowEnd,
      });

      const scheduling = new SchedulingEntity({
        id: randomUUID(),
        salesOrderId: input.salesOrderId,
        deliveryDate: input.deliveryDate,
        windowStart: input.windowStart,
        windowEnd: input.windowEnd,
        confirmedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const createdScheduling = await this.schedulingRepository.create(scheduling, tx);

      order.transitionTo(OrderStatus.AGENDADA);
      await this.salesOrderRepository.update(order, tx);

      return createdScheduling;
    });

    this.eventEmitter.emit('order.delivery.scheduled', {
      orderId: created.salesOrderId,
      schedulingId: created.id,
      deliveryDate: created.deliveryDate,
    });

    return created;
  }
}
