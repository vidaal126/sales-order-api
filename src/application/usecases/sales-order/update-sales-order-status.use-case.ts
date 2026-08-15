import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { OUTBOX_REPOSITORY, SALES_ORDER_REPOSITORY, UNIT_OF_WORK } from '@infrastructure/di-tokens';
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
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(input: UpdateSalesOrderStatusInput): Promise<SalesOrderEntity> {
    return this.unitOfWork.execute(async (tx): Promise<SalesOrderEntity> => {
      const order = await this.salesOrderRepository.findById(input.orderId, tx);
      if (!order) {
        throw new DomainNotFoundException(`Ordem de venda ${input.orderId} não encontrada.`);
      }

      const previousStatus = order.status;

      order.transitionTo(input.newStatus);

      const updated = await this.salesOrderRepository.update(order, tx);

      await this.outboxRepository.enqueue(
        'order.status.changed',
        { orderId: updated.id, previousStatus, currentStatus: updated.status },
        tx,
      );

      return updated;
    });
  }
}
