import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetSalesOrdersUseCase } from './get-sales-orders.use-case';

const mockSalesOrderRepository: ISalesOrderRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

describe('GetSalesOrdersUseCase', (): void => {
  let useCase: GetSalesOrdersUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new GetSalesOrdersUseCase(mockSalesOrderRepository);
  });

  it('should delegate to the repository with no filters', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findAll).mockResolvedValue([]);

    await useCase.execute();

    expect(mockSalesOrderRepository.findAll).toHaveBeenCalledWith(undefined);
  });

  it('should pass filters through to the repository, including a date range', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findAll).mockResolvedValue([]);
    const filters = {
      dateFrom: new Date('1900-01-01'),
      dateTo: new Date('9999-12-31'),
    };

    await useCase.execute(filters);

    expect(mockSalesOrderRepository.findAll).toHaveBeenCalledWith(filters);
  });
});
