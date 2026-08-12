import { CreateItemUseCase } from '@application/usecases/item/create-item.use-case';
import { GetItemsUseCase } from '@application/usecases/item/get-items.use-case';
import { ITEM_REPOSITORY } from '@infrastructure/di-tokens';
import { ItemRepository } from '@infrastructure/repositories/item.repository';
import { Module } from '@nestjs/common';
import { ItemsController } from '@presentation/controllers/v1/items.controller';

@Module({
  controllers: [ItemsController],
  providers: [
    { provide: ITEM_REPOSITORY, useClass: ItemRepository },
    CreateItemUseCase,
    GetItemsUseCase,
  ],
  exports: [ITEM_REPOSITORY],
})
export class ItemModule {}
