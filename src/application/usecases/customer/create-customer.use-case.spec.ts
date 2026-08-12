import { CustomerEntity } from '@domain/entities/customer.entity';
import { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCustomerUseCase } from './create-customer.use-case';

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

const makeTransportType = (id: string): TransportTypeEntity =>
  new TransportTypeEntity({
    id,
    name: `Transporte ${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('CreateCustomerUseCase', (): void => {
  let useCase: CreateCustomerUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new CreateCustomerUseCase(mockCustomerRepository, mockTransportTypeRepository);
  });

  it('should throw DomainException when the document is already registered', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findByDocument).mockResolvedValue(
      new CustomerEntity({
        id: 'existing-id',
        name: 'Existente',
        document: '123.456.789-09',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorizedTransportTypeIds: [],
      }),
    );

    await expect(
      useCase.execute({
        name: 'Novo Cliente',
        document: '123.456.789-09',
        authorizedTransportTypeIds: [],
      }),
    ).rejects.toThrow(DomainException);
    expect(mockCustomerRepository.create).not.toHaveBeenCalled();
  });

  it('should throw DomainException listing missing transport types (and only fetch them once — no N+1)', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findByDocument).mockResolvedValue(undefined);
    vi.mocked(mockTransportTypeRepository.findByIds).mockResolvedValue([makeTransportType('t1')]);

    await expect(
      useCase.execute({
        name: 'Novo Cliente',
        document: '123.456.789-09',
        authorizedTransportTypeIds: ['t1', 't2'],
      }),
    ).rejects.toThrow(DomainException);
    expect(mockTransportTypeRepository.findByIds).toHaveBeenCalledOnce();
    expect(mockTransportTypeRepository.findById).not.toHaveBeenCalled();
  });

  it('should create the customer when the document is new and all transports exist', async (): Promise<void> => {
    vi.mocked(mockCustomerRepository.findByDocument).mockResolvedValue(undefined);
    vi.mocked(mockTransportTypeRepository.findByIds).mockResolvedValue([makeTransportType('t1')]);
    vi.mocked(mockCustomerRepository.create).mockImplementation(
      (customer): Promise<CustomerEntity> => Promise.resolve(customer),
    );

    const result = await useCase.execute({
      name: 'Novo Cliente',
      document: '123.456.789-09',
      authorizedTransportTypeIds: ['t1'],
    });

    expect(result.name).toBe('Novo Cliente');
    expect(mockCustomerRepository.create).toHaveBeenCalledOnce();
  });
});
