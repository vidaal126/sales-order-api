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

export interface RescheduleDeliveryInput {
  salesOrderId: string;
  deliveryDate: Date;
  windowStart: Date;
  windowEnd: Date;
}

@Injectable()
export class RescheduleDeliveryUseCase {
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

        if (order.status === OrderStatus.ENTREGUE) {
          throw new DomainException(`Não é possível reagendar a entrega de uma ordem já entregue.`);
        }

        const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId, tx);
        if (!existing) {
          throw new DomainNotFoundException(
            `Agendamento para ordem ${input.salesOrderId} não encontrado.`,
          );
        }

        if (input.windowStart >= input.windowEnd) {
          throw new DomainException(
            `Janela de atendimento inválida: início deve ser anterior ao fim.`,
          );
        }

        const now = new Date();
        if (input.deliveryDate < now || input.windowStart < now) {
          throw new DomainException('Não é possível reagendar uma entrega para data passada.');
        }

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
