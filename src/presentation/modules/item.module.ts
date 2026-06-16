import { Module } from '@nestjs/common';
import { IItemRepository } from '@domain/repositories/item.repository';
import { ItemRepository } from '@infrastructure/repositories/item.repository';
import { CreateItemUseCase } from '@application/usecases/item/create-item.use-case';
import { GetItemsUseCase } from '@application/usecases/item/get-items.use-case';
import { ItemsController } from '@presentation/controllers/v1/items.controller';

@Module({
  controllers: [ItemsController],
  providers: [
    { provide: IItemRepository, useClass: ItemRepository },
    CreateItemUseCase,
    GetItemsUseCase,
  ],
  exports: [IItemRepository],
})
export class ItemModule {}
