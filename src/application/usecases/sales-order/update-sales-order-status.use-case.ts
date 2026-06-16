import { Inject, Injectable } from "@nestjs/common";
import type { ISalesOrderRepository } from "@domain/repositories/sales-order.repository";
import type { IEventEmitter } from "@domain/events/event-emitter.port";
import { EVENT_EMITTER_PORT } from "@domain/events/event-emitter.port";
import { SalesOrderEntity } from "@domain/entities/sales-order.entity";
import { OrderStatus } from "@domain/enums/order-status.enum";
import { DomainException } from "@domain/exceptions/domain.exception";

export interface UpdateSalesOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
}

@Injectable()
export class UpdateSalesOrderStatusUseCase {
  constructor(
    private readonly salesOrderRepository: ISalesOrderRepository,
    @Inject(EVENT_EMITTER_PORT)
    private readonly eventEmitter: IEventEmitter,
  ) {}

  async execute(input: UpdateSalesOrderStatusInput): Promise<SalesOrderEntity> {
    const order = await this.salesOrderRepository.findById(input.orderId);
    if (!order) {
      throw new DomainException(
        `Ordem de venda ${input.orderId} não encontrada.`,
      );
    }

    const previousStatus = order.status;

    order.transitionTo(input.newStatus);

    const updated = await this.salesOrderRepository.update(order);

    this.eventEmitter.emit("order.status.changed", {
      orderId: updated.id,
      previousStatus,
      currentStatus: updated.status,
    });

    return updated;
  }
}
