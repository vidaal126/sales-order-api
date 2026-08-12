import { CreateItemUseCase } from '@application/usecases/item/create-item.use-case';
import { GetItemsUseCase } from '@application/usecases/item/get-items.use-case';
import type { ItemEntity } from '@domain/entities/item.entity';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@presentation/dtos/common/pagination-query.dto';
import { CreateItemDto } from '@presentation/dtos/item/create-item.dto';

@ApiTags('Items')
@ApiBadRequestResponse({ description: 'Payload ou query string inválidos (falha de validação).' })
@ApiTooManyRequestsResponse({ description: 'Limite de requisições excedido.' })
@ApiInternalServerErrorResponse({ description: 'Erro interno não tratado.' })
@Controller('items')
export class ItemsController {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly getItemsUseCase: GetItemsUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar item',
    description:
      'O SKU é único. `unitPrice` aceita no máximo 2 casas decimais e deve ser positivo.',
  })
  @ApiCreatedResponse({ description: 'Item criado.' })
  @ApiUnprocessableEntityResponse({ description: 'Já existe um item com o mesmo SKU.' })
  async create(@Body() dto: CreateItemDto): Promise<ItemEntity> {
    return this.createItemUseCase.execute({
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      unitPrice: dto.unitPrice,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar itens',
    description: 'Paginado. Sem `limit`, retorna 50 registros; o máximo permitido é 100.',
  })
  @ApiOkResponse({ description: 'Página de itens.' })
  async findAll(@Query() query: PaginationQueryDto): Promise<ItemEntity[]> {
    return this.getItemsUseCase.execute(query);
  }
}
