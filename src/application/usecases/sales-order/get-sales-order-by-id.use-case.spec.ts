import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetSalesOrderByIdUseCase } from './get-sales-order-by-id.use-case';

const mockSalesOrderRepository: ISalesOrderRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

describe('GetSalesOrderByIdUseCase', (): void => {
  let useCase: GetSalesOrderByIdUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new GetSalesOrderByIdUseCase(mockSalesOrderRepository);
  });

  it('should return the order when it exists', async (): Promise<void> => {
    const order = new SalesOrderEntity({
      id: 'order-id',
      customerId: 'customer-id',
      transportTypeId: 'transport-id',
      status: OrderStatus.CRIADA,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [new SalesOrderItemEntity({ itemId: 'item-id', quantity: 1, unitPrice: 10 })],
    });
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(order);

    const result = await useCase.execute('order-id');

    expect(result).toBe(order);
  });

  it('should throw DomainNotFoundException when the order does not exist', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(undefined);

    await expect(useCase.execute('missing')).rejects.toThrow(DomainNotFoundException);
  });
});
