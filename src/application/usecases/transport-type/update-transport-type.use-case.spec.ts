import { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateTransportTypeUseCase } from './update-transport-type.use-case';

const mockTransportTypeRepository: ITransportTypeRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  findAll: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const makeTransportType = (): TransportTypeEntity =>
  new TransportTypeEntity({
    id: 'transport-id',
    name: 'Caminhão',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

describe('UpdateTransportTypeUseCase', (): void => {
  let useCase: UpdateTransportTypeUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new UpdateTransportTypeUseCase(mockTransportTypeRepository);
  });

  it('should throw DomainException when the transport type does not exist', async (): Promise<void> => {
    vi.mocked(mockTransportTypeRepository.findById).mockResolvedValue(undefined);

    await expect(useCase.execute({ id: 'missing', name: 'Novo' })).rejects.toThrow(DomainException);
  });

  it('should throw DomainException when renaming to a name already used by another transport type', async (): Promise<void> => {
    vi.mocked(mockTransportTypeRepository.findById).mockResolvedValue(makeTransportType());
    vi.mocked(mockTransportTypeRepository.findByName).mockResolvedValue(
      new TransportTypeEntity({
        id: 'other-id',
        name: 'Moto',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(useCase.execute({ id: 'transport-id', name: 'Moto' })).rejects.toThrow(
      DomainException,
    );
  });

  it('should not check for name conflicts when the name is unchanged', async (): Promise<void> => {
    vi.mocked(mockTransportTypeRepository.findById).mockResolvedValue(makeTransportType());
    vi.mocked(mockTransportTypeRepository.update).mockImplementation(
      (transportType): Promise<TransportTypeEntity> => Promise.resolve(transportType),
    );

    await useCase.execute({ id: 'transport-id', name: 'Caminhão', description: 'Atualizado' });

    expect(mockTransportTypeRepository.findByName).not.toHaveBeenCalled();
  });

  it('should update the transport type when the new name is free', async (): Promise<void> => {
    vi.mocked(mockTransportTypeRepository.findById).mockResolvedValue(makeTransportType());
    vi.mocked(mockTransportTypeRepository.findByName).mockResolvedValue(undefined);
    vi.mocked(mockTransportTypeRepository.update).mockImplementation(
      (transportType): Promise<TransportTypeEntity> => Promise.resolve(transportType),
    );

    const result = await useCase.execute({ id: 'transport-id', name: 'Van' });

    expect(result.name).toBe('Van');
  });
});
