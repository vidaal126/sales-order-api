import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitterModule, EventEmitter2 } from "@nestjs/event-emitter";
import { ConfigModule } from "@nestjs/config";
import { CreateSalesOrderUseCase } from "./create-sales-order.use-case";
import { CustomerRepository } from "@infrastructure/repositories/customer.repository";
import { ItemRepository } from "@infrastructure/repositories/item.repository";
import { SalesOrderRepository } from "@infrastructure/repositories/sales-order.repository";
import { TransportTypeRepository } from "@infrastructure/repositories/transport-type.repository";
import { PrismaService } from "@infrastructure/database/prisma/prisma.service";
import { OrderStatus } from "@domain/enums/order-status.enum";
import { DomainException } from "@domain/exceptions/domain.exception";
import { EVENT_EMITTER_PORT } from "@domain/events/event-emitter.port";
import { randomUUID } from "crypto";

describe("CreateSalesOrderUseCase - Integration", (): void => {
  let module: TestingModule;
  let useCase: CreateSalesOrderUseCase;
  let prisma: PrismaService;
  let customerId: string;
  let transportTypeId: string;
  let itemId: string;

  beforeAll(async (): Promise<void> => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
      ],
      providers: [
        PrismaService,
        CustomerRepository,
        ItemRepository,
        SalesOrderRepository,
        TransportTypeRepository,
        {
          provide: CreateSalesOrderUseCase,
          useFactory: (
            salesOrderRepo: SalesOrderRepository,
            customerRepo: CustomerRepository,
            itemRepo: ItemRepository,
            eventEmitter: EventEmitter2,
          ): CreateSalesOrderUseCase =>
            new CreateSalesOrderUseCase(
              salesOrderRepo,
              customerRepo,
              itemRepo,
              eventEmitter,
            ),
          inject: [
            SalesOrderRepository,
            CustomerRepository,
            ItemRepository,
            EventEmitter2,
          ],
        },
        { provide: EVENT_EMITTER_PORT, useExisting: EventEmitter2 },
      ],
    }).compile();

    useCase = module.get(CreateSalesOrderUseCase);
    prisma = module.get(PrismaService);
    await prisma.$connect();

    transportTypeId = randomUUID();
    await prisma.transportType.create({
      data: {
        id: transportTypeId,
        name: `Caminhão-${transportTypeId}`,
      },
    });

    customerId = randomUUID();
    await prisma.customer.create({
      data: {
        id: customerId,
        name: "Cliente Teste",
        document: `doc-${customerId}`,
        authorizedTransports: {
          create: [{ transportTypeId }],
        },
      },
    });

    itemId = randomUUID();
    await prisma.item.create({
      data: {
        id: itemId,
        sku: `SKU-${itemId}`,
        name: "Item Teste",
        unitPrice: 10,
      },
    });
  });

  afterAll(async (): Promise<void> => {
    if (!prisma) return;
    await prisma.salesOrderItem.deleteMany({ where: { itemId } });
    await prisma.salesOrder.deleteMany({ where: { customerId } });
    await prisma.item.delete({ where: { id: itemId } });
    await prisma.customerTransportType.deleteMany({ where: { customerId } });
    await prisma.customer.delete({ where: { id: customerId } });
    await prisma.transportType.delete({ where: { id: transportTypeId } });
    await prisma.$disconnect();
    await module.close();
  });

  it("should create a sales order successfully", async (): Promise<void> => {
    const order = await useCase.execute({
      customerId,
      transportTypeId,
      items: [{ itemId, quantity: 2 }],
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe(OrderStatus.CRIADA);
    expect(order.customerId).toBe(customerId);
    expect(order.items).toHaveLength(1);
  });

  it("should throw DomainException when transport not authorized", async (): Promise<void> => {
    await expect(
      useCase.execute({
        customerId,
        transportTypeId: randomUUID(),
        items: [{ itemId, quantity: 1 }],
      }),
    ).rejects.toThrow(DomainException);
  });
});
