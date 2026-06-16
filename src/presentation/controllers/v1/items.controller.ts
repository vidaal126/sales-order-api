import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateItemUseCase } from '@application/usecases/item/create-item.use-case';
import { GetItemsUseCase } from '@application/usecases/item/get-items.use-case';
import { CreateItemDto } from '@presentation/dtos/item/create-item.dto';
import { ItemEntity } from '@domain/entities/item.entity';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly getItemsUseCase: GetItemsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar item' })
  async create(@Body() dto: CreateItemDto): Promise<ItemEntity> {
    return this.createItemUseCase.execute({ sku: dto.sku, name: dto.name, description: dto.description, unitPrice: dto.unitPrice });
  }

  @Get()
  @ApiOperation({ summary: 'Listar itens' })
  async findAll(): Promise<ItemEntity[]> {
    return this.getItemsUseCase.execute();
  }
}
