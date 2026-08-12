import type { IItemRepository } from '@domain/repositories/item.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetItemsUseCase } from './get-items.use-case';

const mockItemRepository: IItemRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findBySku: vi.fn(),
  findByIds: vi.fn(),
  create: vi.fn(),
};

describe('GetItemsUseCase', (): void => {
  let useCase: GetItemsUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new GetItemsUseCase(mockItemRepository);
  });

  it('should delegate pagination params to the repository', async (): Promise<void> => {
    vi.mocked(mockItemRepository.findAll).mockResolvedValue([]);

    await useCase.execute({ page: 1, limit: 25 });

    expect(mockItemRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 25 });
  });
});
