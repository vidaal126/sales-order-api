import { CustomerEntity } from '@domain/entities/customer.entity';
import { ItemEntity } from '@domain/entities/item.entity';
import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { IItemRepository } from '@domain/repositories/item.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSalesOrderUseCase } from './create-sales-order.use-case';

const mockCustomerRepository: ICustomerRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findByDocument: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockItemRepository: IItemRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findBySku: vi.fn(),
  findByIds: vi.fn(),
  create: vi.fn(),
};

const mockSalesOrderRepository: ISalesOrderRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockEventEmitter: IEventEmitter = {
  emit: vi.fn(),
};

const makeCustomer = (authorizedTransportTypeIds: string[]): CustomerEntity =>
  new CustomerEntity({
    id: 'customer-id',
    name: 'João Silva',
    document: '123.456.789-00',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorizedTransportTypeIds,
  });

const makeItem = (): ItemEntity =>
  new ItemEntity({
    id: 'item-id',
    sku: 'SKU-001',
    name: 'Caixa de papelão',
    unitPrice: 29.9,
    createdAt: new Date(),
  });

const makeOrder = (): SalesOrderEntity =>
  new SalesOrderEntity({
    id: 'order-id',
    customerId: 'customer-id',
    transportTypeId: 'transport-id',
    status: OrderStatus.CRIADA,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [new SalesOrderItemEntity({ itemId: 'item-id', quantity: 2, unitPrice: 29.9 })],
  });

describe('CreateSalesOrderUseCase', (): void => {
  let useCase: CreateSalesOrderUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new CreateSalesOrderUseCase(
      mockSalesOrderRepository,
      mockCustomerRepository,
      mockItemRepository,
      mockEventEmitter,
    );
  });

  it('should throw DomainException when customer not found', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        customerId: 'non-existent',
        transportTypeId: 'transport-id',
        items: [{ itemId: 'item-id', quantity: 1 }],
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException when transport not authorized for customer', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(makeCustomer([]));

    await expect(
      useCase.execute({
        customerId: 'customer-id',
        transportTypeId: 'unauthorized-transport',
        items: [{ itemId: 'item-id', quantity: 1 }],
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException when item not found', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(makeCustomer(['transport-id']));
    vi.mocked(mockItemRepository.findByIds).mockResolvedValue([]);

    await expect(
      useCase.execute({
        customerId: 'customer-id',
        transportTypeId: 'transport-id',
        items: [{ itemId: 'non-existent-item', quantity: 1 }],
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should create order and emit event when all validations pass', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(makeCustomer(['transport-id']));
    vi.mocked(mockItemRepository.findByIds).mockResolvedValue([makeItem()]);
    vi.mocked(mockSalesOrderRepository.create).mockResolvedValue(makeOrder());

    await useCase.execute({
      customerId: 'customer-id',
      transportTypeId: 'transport-id',
      items: [{ itemId: 'item-id', quantity: 2 }],
    });

    expect(mockSalesOrderRepository.create).toHaveBeenCalledOnce();
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.created', expect.any(Object));
  });
});
