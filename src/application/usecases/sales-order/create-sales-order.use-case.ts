import { Inject, Injectable } from "@nestjs/common";
import type { ISalesOrderRepository } from "@domain/repositories/sales-order.repository";
import type { ICustomerRepository } from "@domain/repositories/customer.repository";
import type { IItemRepository } from "@domain/repositories/item.repository";
import { SalesOrderEntity } from "@domain/entities/sales-order.entity";
import { SalesOrderItemEntity } from "@domain/entities/sales-order-item.entity";
import { OrderStatus } from "@domain/enums/order-status.enum";
import { DomainException } from "@domain/exceptions/domain.exception";
import { randomUUID } from "crypto";
import { EventEmitter2 } from "@nestjs/event-emitter";

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
    private readonly salesOrderRepository: ISalesOrderRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly itemRepository: IItemRepository,
    @Inject(EventEmitter2)
    private readonly eventEmitter: EventEmitter2,
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
      throw new DomainException(`Itens não encontrados: ${missing.join(", ")}`);
    }

    const orderItems = input.items.map((inputItem): SalesOrderItemEntity => {
      const item = foundItems.find((i): boolean => i.id === inputItem.itemId)!;
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

    this.eventEmitter.emit("order.created", {
      orderId: created.id,
      customerId: created.customerId,
      status: created.status,
    });

    return created;
  }
}
