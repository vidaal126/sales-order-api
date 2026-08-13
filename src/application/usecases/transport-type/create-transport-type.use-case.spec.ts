import { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTransportTypeUseCase } from './create-transport-type.use-case';

const mockTransportTypeRepository: ITransportTypeRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  findAll: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

describe('CreateTransportTypeUseCase', (): void => {
  let useCase: CreateTransportTypeUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new CreateTransportTypeUseCase(mockTransportTypeRepository);
  });

  it('should throw DomainException when the name already exists', async (): Promise<void> => {
    vi.mocked(mockTransportTypeRepository.findByName).mockResolvedValue(
      new TransportTypeEntity({
        id: 'existing-id',
        name: 'Caminhão',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(useCase.execute({ name: 'Caminhão' })).rejects.toThrow(DomainException);
    expect(mockTransportTypeRepository.create).not.toHaveBeenCalled();
  });

  it('should create the transport type when the name is new', async (): Promise<void> => {
    vi.mocked(mockTransportTypeRepository.findByName).mockResolvedValue(undefined);
    vi.mocked(mockTransportTypeRepository.create).mockImplementation(
      (transportType): Promise<TransportTypeEntity> => Promise.resolve(transportType),
    );

    const result = await useCase.execute({ name: 'Moto' });

    expect(result.name).toBe('Moto');
  });
});
