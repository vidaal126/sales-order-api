import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainException } from '@domain/exceptions/domain.exception';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateSalesOrderStatusUseCase } from './update-sales-order-status.use-case';

const mockSalesOrderRepository: ISalesOrderRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockOutboxRepository: IOutboxRepository = {
  enqueue: vi.fn(),
  findUnpublished: vi.fn(),
  markPublished: vi.fn(),
};

const mockUnitOfWork: IUnitOfWork = {
  execute: <T>(work: (tx: unknown) => Promise<T>): Promise<T> => work({}),
};

const makeOrder = (status: OrderStatus): SalesOrderEntity =>
  new SalesOrderEntity({
    id: 'order-id',
    customerId: 'customer-id',
    transportTypeId: 'transport-id',
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [new SalesOrderItemEntity({ itemId: 'item-id', quantity: 1, unitPrice: 10 })],
  });

describe('UpdateSalesOrderStatusUseCase', (): void => {
  let useCase: UpdateSalesOrderStatusUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new UpdateSalesOrderStatusUseCase(
      mockSalesOrderRepository,
      mockOutboxRepository,
      mockUnitOfWork,
    );
  });

  it('should throw DomainNotFoundException when the order does not exist', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(undefined);

    await expect(
      useCase.execute({ orderId: 'missing', newStatus: OrderStatus.PLANEJADA }),
    ).rejects.toThrow(DomainNotFoundException);
  });

  it('should throw DomainException for an invalid status jump (CRIADA -> ENTREGUE)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.CRIADA));

    await expect(
      useCase.execute({ orderId: 'order-id', newStatus: OrderStatus.ENTREGUE }),
    ).rejects.toThrow(DomainException);
    expect(mockSalesOrderRepository.update).not.toHaveBeenCalled();
    expect(mockOutboxRepository.enqueue).not.toHaveBeenCalled();
  });

  it('should throw DomainException when advancing past ENTREGUE', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.ENTREGUE));

    await expect(
      useCase.execute({ orderId: 'order-id', newStatus: OrderStatus.CRIADA }),
    ).rejects.toThrow(DomainException);
  });

  it('should update the status and emit order.status.changed with previous and current status', async (): Promise<void> => {
    const order = makeOrder(OrderStatus.CRIADA);
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(order);
    vi.mocked(mockSalesOrderRepository.update).mockImplementation(
      (updatedOrder): Promise<SalesOrderEntity> => Promise.resolve(updatedOrder),
    );

    const result = await useCase.execute({ orderId: 'order-id', newStatus: OrderStatus.PLANEJADA });

    expect(result.status).toBe(OrderStatus.PLANEJADA);
    expect(mockOutboxRepository.enqueue).toHaveBeenCalledWith(
      'order.status.changed',
      {
        orderId: 'order-id',
        previousStatus: OrderStatus.CRIADA,
        currentStatus: OrderStatus.PLANEJADA,
      },
      expect.anything(),
    );
  });
});
