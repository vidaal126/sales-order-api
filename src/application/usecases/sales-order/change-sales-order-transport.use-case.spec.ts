import { CustomerEntity } from '@domain/entities/customer.entity';
import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import { DomainException } from '@domain/exceptions/domain.exception';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeSalesOrderTransportUseCase } from './change-sales-order-transport.use-case';

const mockSalesOrderRepository: ISalesOrderRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockCustomerRepository: ICustomerRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findByDocument: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockEventEmitter: IEventEmitter = {
  emit: vi.fn(),
};

const mockUnitOfWork: IUnitOfWork = {
  execute: <T>(work: (tx: unknown) => Promise<T>): Promise<T> => work({}),
};

const makeOrder = (status: OrderStatus, transportTypeId = 'old-transport-id'): SalesOrderEntity =>
  new SalesOrderEntity({
    id: 'order-id',
    customerId: 'customer-id',
    transportTypeId,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [new SalesOrderItemEntity({ itemId: 'item-id', quantity: 1, unitPrice: 10 })],
  });

const makeCustomer = (authorizedTransportTypeIds: string[]): CustomerEntity =>
  new CustomerEntity({
    id: 'customer-id',
    name: 'Cliente Teste',
    document: '123.456.789-09',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorizedTransportTypeIds,
  });

describe('ChangeSalesOrderTransportUseCase', (): void => {
  let useCase: ChangeSalesOrderTransportUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new ChangeSalesOrderTransportUseCase(
      mockSalesOrderRepository,
      mockCustomerRepository,
      mockEventEmitter,
      mockUnitOfWork,
    );
  });

  it('should throw DomainNotFoundException when the order does not exist', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(undefined);

    await expect(
      useCase.execute({ salesOrderId: 'missing', transportTypeId: 'new-transport-id' }),
    ).rejects.toThrow(DomainNotFoundException);
  });

  it('should throw DomainException when the order is EM_TRANSPORTE', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(
      makeOrder(OrderStatus.EM_TRANSPORTE),
    );

    await expect(
      useCase.execute({ salesOrderId: 'order-id', transportTypeId: 'new-transport-id' }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException when the order is already ENTREGUE', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.ENTREGUE));

    await expect(
      useCase.execute({ salesOrderId: 'order-id', transportTypeId: 'new-transport-id' }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainNotFoundException when the customer no longer exists', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.CRIADA));
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(undefined);

    await expect(
      useCase.execute({ salesOrderId: 'order-id', transportTypeId: 'new-transport-id' }),
    ).rejects.toThrow(DomainNotFoundException);
  });

  it('should throw DomainException when the new transport is not authorized for the customer', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.CRIADA));
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(makeCustomer(['other-transport']));

    await expect(
      useCase.execute({ salesOrderId: 'order-id', transportTypeId: 'new-transport-id' }),
    ).rejects.toThrow(DomainException);
  });

  it('should change the transport and emit order.transport.changed with previous and current ids', async (): Promise<void> => {
    const order = makeOrder(OrderStatus.PLANEJADA, 'old-transport-id');
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(order);
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(
      makeCustomer(['new-transport-id']),
    );
    vi.mocked(mockSalesOrderRepository.update).mockImplementation(
      (updatedOrder): Promise<SalesOrderEntity> => Promise.resolve(updatedOrder),
    );

    const result = await useCase.execute({
      salesOrderId: 'order-id',
      transportTypeId: 'new-transport-id',
    });

    expect(result.transportTypeId).toBe('new-transport-id');
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.transport.changed', {
      orderId: 'order-id',
      previousTransportTypeId: 'old-transport-id',
      currentTransportTypeId: 'new-transport-id',
    });
  });
});
