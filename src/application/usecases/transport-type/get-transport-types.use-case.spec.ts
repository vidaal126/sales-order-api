import { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetTransportTypesUseCase } from './get-transport-types.use-case';

const mockTransportTypeRepository: ITransportTypeRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  findAll: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

describe('GetTransportTypesUseCase', (): void => {
  let useCase: GetTransportTypesUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new GetTransportTypesUseCase(mockTransportTypeRepository);
  });

  it('should return all transport types from the repository', async (): Promise<void> => {
    const transportTypes = [
      new TransportTypeEntity({
        id: '1',
        name: 'Moto',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];
    vi.mocked(mockTransportTypeRepository.findAll).mockResolvedValue(transportTypes);

    expect(await useCase.execute()).toBe(transportTypes);
  });
});
