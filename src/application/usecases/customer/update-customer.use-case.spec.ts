import { CustomerEntity } from '@domain/entities/customer.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateCustomerUseCase } from './update-customer.use-case';

const mockCustomerRepository: ICustomerRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findByDocument: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockTransportTypeRepository: ITransportTypeRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  findAll: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const makeCustomer = (): CustomerEntity =>
  new CustomerEntity({
    id: 'customer-id',
    name: 'Cliente Original',
    document: '123.456.789-09',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    authorizedTransportTypeIds: ['t1'],
  });

describe('UpdateCustomerUseCase', (): void => {
  let useCase: UpdateCustomerUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new UpdateCustomerUseCase(mockCustomerRepository, mockTransportTypeRepository);
  });

  it('should throw DomainException when the customer does not exist', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(undefined);

    await expect(useCase.execute({ id: 'missing', name: 'Novo Nome' })).rejects.toThrow(
      DomainException,
    );
  });

  it('should throw DomainException when a new authorized transport does not exist', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(makeCustomer());
    vi.mocked(mockTransportTypeRepository.findByIds).mockResolvedValue([]);

    await expect(
      useCase.execute({ id: 'customer-id', authorizedTransportTypeIds: ['missing-transport'] }),
    ).rejects.toThrow(DomainException);
  });

  it('should allow clearing all authorized transports (empty array)', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(makeCustomer());
    vi.mocked(mockTransportTypeRepository.findByIds).mockResolvedValue([]);
    vi.mocked(mockCustomerRepository.update).mockImplementation(
      (customer): Promise<CustomerEntity> => Promise.resolve(customer),
    );

    const result = await useCase.execute({ id: 'customer-id', authorizedTransportTypeIds: [] });

    expect(result.authorizedTransportTypeIds).toEqual([]);
  });

  it('should keep the original document unchanged even when other fields are updated', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(makeCustomer());
    vi.mocked(mockCustomerRepository.update).mockImplementation(
      (customer): Promise<CustomerEntity> => Promise.resolve(customer),
    );

    const result = await useCase.execute({ id: 'customer-id', name: 'Nome Atualizado' });

    expect(result.name).toBe('Nome Atualizado');
    expect(result.document).toBe('123.456.789-09');
  });
});
