import { ItemEntity } from '@domain/entities/item.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { IItemRepository } from '@domain/repositories/item.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateItemUseCase } from './create-item.use-case';

const mockItemRepository: IItemRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findBySku: vi.fn(),
  findByIds: vi.fn(),
  create: vi.fn(),
};

describe('CreateItemUseCase', (): void => {
  let useCase: CreateItemUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new CreateItemUseCase(mockItemRepository);
  });

  it('should throw DomainException when the SKU already exists', async (): Promise<void> => {
    vi.mocked(mockItemRepository.findBySku).mockResolvedValue(
      new ItemEntity({
        id: 'existing-id',
        sku: 'SKU-1',
        name: 'Item existente',
        unitPrice: 10,
        createdAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ sku: 'SKU-1', name: 'Item novo', unitPrice: 20 }),
    ).rejects.toThrow(DomainException);
    expect(mockItemRepository.create).not.toHaveBeenCalled();
  });

  it('should create the item when the SKU is new', async (): Promise<void> => {
    vi.mocked(mockItemRepository.findBySku).mockResolvedValue(undefined);
    vi.mocked(mockItemRepository.create).mockImplementation(
      (item): Promise<ItemEntity> => Promise.resolve(item),
    );

    const result = await useCase.execute({ sku: 'SKU-2', name: 'Item novo', unitPrice: 15.5 });

    expect(result.sku).toBe('SKU-2');
    expect(result.unitPrice).toBe(15.5);
  });
});
