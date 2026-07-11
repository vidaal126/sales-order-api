import { CreateItemUseCase } from '@application/usecases/item/create-item.use-case';
import { GetItemsUseCase } from '@application/usecases/item/get-items.use-case';
import type { ItemEntity } from '@domain/entities/item.entity';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '@presentation/dtos/common/pagination-query.dto';
import { CreateItemDto } from '@presentation/dtos/item/create-item.dto';

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
    return this.createItemUseCase.execute({
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      unitPrice: dto.unitPrice,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar itens' })
  async findAll(@Query() query: PaginationQueryDto): Promise<ItemEntity[]> {
    return this.getItemsUseCase.execute(query);
  }
}
