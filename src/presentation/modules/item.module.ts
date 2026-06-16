import { Module } from '@nestjs/common';
import { ItemRepository } from '@infrastructure/repositories/item.repository';
import { CreateItemUseCase } from '@application/usecases/item/create-item.use-case';
import { GetItemsUseCase } from '@application/usecases/item/get-items.use-case';
import { ItemsController } from '@presentation/controllers/v1/items.controller';

@Module({
  controllers: [ItemsController],
  providers: [ItemRepository, CreateItemUseCase, GetItemsUseCase],
  exports: [ItemRepository],
})
export class ItemModule {}
