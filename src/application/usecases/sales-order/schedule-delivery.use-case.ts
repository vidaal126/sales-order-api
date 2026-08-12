import { randomUUID } from 'node:crypto';
import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import type { ISchedulingRepository } from '@domain/repositories/scheduling.repository';

export interface ScheduleDeliveryInput {
  salesOrderId: string;
  deliveryDate: Date;
  windowStart: Date;
  windowEnd: Date;
}

export class ScheduleDeliveryUseCase {
  constructor(
    private readonly salesOrderRepository: ISalesOrderRepository,
    private readonly schedulingRepository: ISchedulingRepository,
    private readonly eventEmitter: IEventEmitter,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(input: ScheduleDeliveryInput): Promise<SchedulingEntity> {
    const created = await this.unitOfWork.execute(
      async (transaction): Promise<SchedulingEntity> => {
        const order = await this.salesOrderRepository.findById(input.salesOrderId, transaction);
        if (!order) {
          throw new DomainNotFoundException(`Ordem de venda ${input.salesOrderId} não encontrada.`);
        }

        if (!order.canTransitionTo(OrderStatus.AGENDADA)) {
          throw new DomainException(
            `Ordem de venda não pode ser agendada no status atual: ${order.status}.`,
          );
        }

        const existing = await this.schedulingRepository.findBySalesOrderId(
          input.salesOrderId,
          transaction,
        );
        if (existing) {
          throw new DomainException(`Ordem de venda ${input.salesOrderId} já possui agendamento.`);
        }

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

        const createdScheduling = await this.schedulingRepository.create(scheduling, transaction);

        order.transitionTo(OrderStatus.AGENDADA);
        await this.salesOrderRepository.update(order, transaction);

        return createdScheduling;
      },
    );

    this.eventEmitter.emit('order.delivery.scheduled', {
      orderId: created.salesOrderId,
      schedulingId: created.id,
      deliveryDate: created.deliveryDate,
    });

    return created;
  }
}
