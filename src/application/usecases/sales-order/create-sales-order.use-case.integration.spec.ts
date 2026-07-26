import { randomUUID } from 'node:crypto';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { EVENT_EMITTER_PORT } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { IItemRepository } from '@domain/repositories/item.repository';
import { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { PrismaUnitOfWork } from '@infrastructure/database/prisma/prisma-unit-of-work';
import { CustomerRepository } from '@infrastructure/repositories/customer.repository';
import { ItemRepository } from '@infrastructure/repositories/item.repository';
import { SalesOrderRepository } from '@infrastructure/repositories/sales-order.repository';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateSalesOrderUseCase } from './create-sales-order.use-case';

/** Gera um CPF com dígitos verificadores válidos para os seeds de integração. */
const makeValidCpf = (): string => {
  const base = Array.from({ length: 9 }, (): number => Math.floor(Math.random() * 10));
  const checkDigit = (nums: number[]): number => {
    const sum = nums.reduce((acc, n, i): number => acc + n * (nums.length + 1 - i), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  const d1 = checkDigit(base);
  const d2 = checkDigit([...base, d1]);
  const all = [...base, d1, d2].join('');
  return `${all.slice(0, 3)}.${all.slice(3, 6)}.${all.slice(6, 9)}-${all.slice(9, 11)}`;
};

describe('CreateSalesOrderUseCase - Integration', (): void => {
  let module: TestingModule;
  let useCase: CreateSalesOrderUseCase;
  let prisma: PrismaService;
  let customerId: string;
  let transportTypeId: string;
  let itemId: string;

  beforeAll(async (): Promise<void> => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EventEmitterModule.forRoot()],
      providers: [
        PrismaService,
        { provide: ICustomerRepository, useClass: CustomerRepository },
        { provide: IItemRepository, useClass: ItemRepository },
        { provide: ISalesOrderRepository, useClass: SalesOrderRepository },
        { provide: IUnitOfWork, useClass: PrismaUnitOfWork },
        { provide: EVENT_EMITTER_PORT, useExisting: EventEmitter2 },
        CreateSalesOrderUseCase,
      ],
    }).compile();

    useCase = module.get(CreateSalesOrderUseCase);
    prisma = module.get(PrismaService);

    transportTypeId = randomUUID();
    await prisma.transportType.create({
      data: { id: transportTypeId, name: `Caminhão-${transportTypeId}` },
    });

    customerId = randomUUID();
    const document = makeValidCpf();
    await prisma.customer.create({
      data: {
        id: customerId,
        name: 'Cliente Teste',
        document,
        authorizedTransports: { create: [{ transportTypeId }] },
      },
    });

    itemId = randomUUID();
    await prisma.item.create({
      data: { id: itemId, sku: `SKU-${itemId}`, name: 'Item Teste', unitPrice: 10 },
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

  it('should create a sales order successfully', async (): Promise<void> => {
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

  it('should throw DomainException when transport not authorized', async (): Promise<void> => {
    await expect(
      useCase.execute({
        customerId,
        transportTypeId: randomUUID(),
        items: [{ itemId, quantity: 1 }],
      }),
    ).rejects.toThrow(DomainException);
  });
});
