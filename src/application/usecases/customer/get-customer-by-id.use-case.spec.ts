import { CustomerEntity } from '@domain/entities/customer.entity';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetCustomerByIdUseCase } from './get-customer-by-id.use-case';

const mockCustomerRepository: ICustomerRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findByDocument: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

describe('GetCustomerByIdUseCase', (): void => {
  let useCase: GetCustomerByIdUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new GetCustomerByIdUseCase(mockCustomerRepository);
  });

  it('should return the customer when found', async (): Promise<void> => {
    const customer = new CustomerEntity({
      id: 'customer-id',
      name: 'Cliente',
      document: '123.456.789-09',
      createdAt: new Date(),
      updatedAt: new Date(),
      authorizedTransportTypeIds: [],
    });
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(customer);

    expect(await useCase.execute('customer-id')).toBe(customer);
  });

  it('should throw DomainNotFoundException (not a generic DomainException) when the customer does not exist', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(undefined);

    await expect(useCase.execute('missing')).rejects.toThrow(DomainNotFoundException);
  });
});
