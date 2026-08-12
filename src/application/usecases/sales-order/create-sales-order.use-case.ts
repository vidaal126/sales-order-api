import { randomUUID } from 'node:crypto';
import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { IItemRepository } from '@domain/repositories/item.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import {
  CUSTOMER_REPOSITORY,
  EVENT_EMITTER,
  ITEM_REPOSITORY,
  SALES_ORDER_REPOSITORY,
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
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: IEventEmitter,
  ) {}

  async execute(input: CreateSalesOrderInput): Promise<SalesOrderEntity> {
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw new DomainException(`Cliente ${input.customerId} não encontrado.`);
    }

    if (!customer.isTransportAuthorized(input.transportTypeId)) {
      throw new DomainException(
        `Tipo de transporte ${input.transportTypeId} não autorizado para o cliente ${customer.name}.`,
      );
    }

    const itemIds = input.items.map((i): string => i.itemId);
    const foundItems = await this.itemRepository.findByIds(itemIds);

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

    const created = await this.salesOrderRepository.create(order);

    this.eventEmitter.emit('order.created', {
      orderId: created.id,
      customerId: created.customerId,
      status: created.status,
    });

    return created;
  }
}
