import { randomUUID } from 'node:crypto';
import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { IItemRepository } from '@domain/repositories/item.repository';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import {
  CUSTOMER_REPOSITORY,
  ITEM_REPOSITORY,
  OUTBOX_REPOSITORY,
  SALES_ORDER_REPOSITORY,
  UNIT_OF_WORK,
} from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

export interface CreateSalesOrderInput {
  customerId: string;
  transportTypeId: string;
  notes?: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
}

@Injectable()
export class CreateSalesOrderUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: ISalesOrderRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(input: CreateSalesOrderInput): Promise<SalesOrderEntity> {
    return this.unitOfWork.execute(async (tx): Promise<SalesOrderEntity> => {
      const customer = await this.customerRepository.findById(input.customerId, tx);
      if (!customer) {
        throw new DomainException(`Cliente ${input.customerId} não encontrado.`);
      }

      if (!customer.isTransportAuthorized(input.transportTypeId)) {
        throw new DomainException(
          `Tipo de transporte ${input.transportTypeId} não autorizado para o cliente ${customer.name}.`,
        );
      }

      const itemIds = input.items.map((i): string => i.itemId);
      if (new Set(itemIds).size !== itemIds.length) {
        throw new DomainException(
          'A ordem de venda não pode conter o mesmo item em mais de uma linha.',
        );
      }

      const foundItems = await this.itemRepository.findByIds(itemIds, tx);

      if (foundItems.length !== itemIds.length) {
        const foundIds = foundItems.map((i): string => i.id);
        const missing = itemIds.filter((id): boolean => !foundIds.includes(id));
        throw new DomainException(`Itens não encontrados: ${missing.join(', ')}`);
      }

      const orderItems = input.items.map((inputItem): SalesOrderItemEntity => {
        const item = foundItems.find((i): boolean => i.id === inputItem.itemId);
        if (!item) {
          throw new DomainException(`Item ${inputItem.itemId} não encontrado.`);
        }
        return new SalesOrderItemEntity({
          itemId: item.id,
          quantity: inputItem.quantity,
          unitPrice: item.unitPrice,
        });
      });

      const order = new SalesOrderEntity({
        id: randomUUID(),
        customerId: customer.id,
        transportTypeId: input.transportTypeId,
        status: OrderStatus.CRIADA,
        notes: input.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: orderItems,
      });

      const created = await this.salesOrderRepository.create(order, tx);

      await this.outboxRepository.enqueue(
        'order.created',
        { orderId: created.id, customerId: created.customerId, status: created.status },
        tx,
      );

      return created;
    });
  }
}
