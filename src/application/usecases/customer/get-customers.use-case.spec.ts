import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetCustomersUseCase } from './get-customers.use-case';

const mockCustomerRepository: ICustomerRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findByDocument: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

describe('GetCustomersUseCase', (): void => {
  let useCase: GetCustomersUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new GetCustomersUseCase(mockCustomerRepository);
  });

  it('should delegate pagination params to the repository', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findAll).mockResolvedValue([]);

    await useCase.execute({ page: 2, limit: 10 });

    expect(mockCustomerRepository.findAll).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });
});
