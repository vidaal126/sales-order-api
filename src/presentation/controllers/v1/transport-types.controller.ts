import { CreateTransportTypeUseCase } from '@application/usecases/transport-type/create-transport-type.use-case';
import { GetTransportTypesUseCase } from '@application/usecases/transport-type/get-transport-types.use-case';
import { UpdateTransportTypeUseCase } from '@application/usecases/transport-type/update-transport-type.use-case';
import type { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateTransportTypeDto } from '@presentation/dtos/transport-type/create-transport-type.dto';
import { UpdateTransportTypeDto } from '@presentation/dtos/transport-type/update-transport-type.dto';

@ApiTags('Transport Types')
@ApiBadRequestResponse({ description: 'Payload inválido (falha de validação).' })
@ApiTooManyRequestsResponse({ description: 'Limite de requisições excedido.' })
@ApiInternalServerErrorResponse({ description: 'Erro interno não tratado.' })
@Controller('transport-types')
export class TransportTypesController {
  constructor(
    private readonly createTransportTypeUseCase: CreateTransportTypeUseCase,
    private readonly updateTransportTypeUseCase: UpdateTransportTypeUseCase,
    private readonly getTransportTypesUseCase: GetTransportTypesUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar tipo de transporte',
    description: 'O nome é único entre todos os tipos de transporte.',
  })
  @ApiCreatedResponse({ description: 'Tipo de transporte criado.' })
  @ApiUnprocessableEntityResponse({ description: 'Já existe um tipo de transporte com esse nome.' })
  async create(@Body() dto: CreateTransportTypeDto): Promise<TransportTypeEntity> {
    return this.createTransportTypeUseCase.execute({
      name: dto.name,
      description: dto.description,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar tipo de transporte',
    description: 'Campos omitidos preservam o valor atual.',
  })
  @ApiParam({ name: 'id', description: 'UUID do tipo de transporte.' })
  @ApiOkResponse({ description: 'Tipo de transporte atualizado.' })
  @ApiUnprocessableEntityResponse({
    description: 'Tipo de transporte não encontrado ou nome já usado por outro registro.',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransportTypeDto,
  ): Promise<TransportTypeEntity> {
    return this.updateTransportTypeUseCase.execute({
      id,
      name: dto.name,
      description: dto.description,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de transporte' })
  @ApiOkResponse({ description: 'Lista de tipos de transporte.' })
  async findAll(): Promise<TransportTypeEntity[]> {
    return this.getTransportTypesUseCase.execute();
  }
}
