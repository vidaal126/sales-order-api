import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { EVENT_EMITTER, SALES_ORDER_REPOSITORY, UNIT_OF_WORK } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

export interface UpdateSalesOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
}

@Injectable()
export class UpdateSalesOrderStatusUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: ISalesOrderRepository,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: IEventEmitter,
    @Inject(UNIT_OF_WORK)
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
