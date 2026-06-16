import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { EVENT_EMITTER_PORT } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
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
  ) {}

  async execute(input: UpdateSalesOrderStatusInput): Promise<SalesOrderEntity> {
    const order = await this.salesOrderRepository.findById(input.orderId);
    if (!order) {
      throw new DomainException(`Ordem de venda ${input.orderId} não encontrada.`);
    }

    const previousStatus = order.status;

    order.transitionTo(input.newStatus);

    const updated = await this.salesOrderRepository.update(order);

    this.eventEmitter.emit('order.status.changed', {
      orderId: updated.id,
      previousStatus,
      currentStatus: updated.status,
    });

    return updated;
  }
}
