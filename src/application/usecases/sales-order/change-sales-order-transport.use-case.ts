import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainException } from '@domain/exceptions/domain.exception';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import {
  CUSTOMER_REPOSITORY,
  OUTBOX_REPOSITORY,
  SALES_ORDER_REPOSITORY,
  UNIT_OF_WORK,
} from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

export interface ChangeSalesOrderTransportInput {
  salesOrderId: string;
  transportTypeId: string;
}

const TRANSPORT_LOCKED_STATUSES = [OrderStatus.EM_TRANSPORTE, OrderStatus.ENTREGUE];

@Injectable()
export class ChangeSalesOrderTransportUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: ISalesOrderRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(input: ChangeSalesOrderTransportInput): Promise<SalesOrderEntity> {
    return this.unitOfWork.execute(async (tx): Promise<SalesOrderEntity> => {
      const order = await this.salesOrderRepository.findById(input.salesOrderId, tx);
      if (!order) {
        throw new DomainNotFoundException(`Ordem de venda ${input.salesOrderId} não encontrada.`);
      }

      if (TRANSPORT_LOCKED_STATUSES.includes(order.status)) {
        throw new DomainException(
          `Não é possível alterar o transporte de uma ordem no status ${order.status}.`,
        );
      }

      const customer = await this.customerRepository.findById(order.customerId);
      if (!customer) {
        throw new DomainNotFoundException(`Cliente ${order.customerId} não encontrado.`);
      }

      if (!customer.isTransportAuthorized(input.transportTypeId)) {
        throw new DomainException(
          `Tipo de transporte ${input.transportTypeId} não autorizado para o cliente ${customer.name}.`,
        );
      }

      const previousTransportTypeId = order.transportTypeId;
      order.changeTransportTo(input.transportTypeId);

      const updated = await this.salesOrderRepository.update(order, tx);

      await this.outboxRepository.enqueue(
        'order.transport.changed',
        {
          orderId: updated.id,
          previousTransportTypeId,
          currentTransportTypeId: updated.transportTypeId,
        },
        tx,
      );

      return updated;
    });
  }
}
