import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { EVENT_EMITTER_PORT } from '@domain/events/event-emitter.port';
import { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { DomainNotFoundException } from '@infrastructure/http/exceptions/not-found.exception';
import { Inject, Injectable } from '@nestjs/common';

export interface UpdateSalesOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
}

@Injectable()
export class UpdateSalesOrderStatusUseCase {
  constructor(
    @Inject(ISalesOrderRepository)
    private readonly salesOrderRepository: ISalesOrderRepository,
    @Inject(EVENT_EMITTER_PORT)
    private readonly eventEmitter: IEventEmitter,
    @Inject(IUnitOfWork)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(input: UpdateSalesOrderStatusInput): Promise<SalesOrderEntity> {
    interface UpdateResult {
      updated: SalesOrderEntity;
      previousStatus: OrderStatus;
    }

    const { updated, previousStatus } = await this.unitOfWork.execute(
      async (tx): Promise<UpdateResult> => {
        const order = await this.salesOrderRepository.findById(input.orderId, tx);
        if (!order) {
          throw new DomainNotFoundException(`Ordem de venda ${input.orderId} não encontrada.`);
        }

        const previousStatus = order.status;

        order.transitionTo(input.newStatus);

        const updated = await this.salesOrderRepository.update(order, tx);

        return { updated, previousStatus };
      },
    );

    this.eventEmitter.emit('order.status.changed', {
      orderId: updated.id,
      previousStatus,
      currentStatus: updated.status,
    });

    return updated;
  }
}
