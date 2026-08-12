import { CreateCustomerUseCase } from '@application/usecases/customer/create-customer.use-case';
import { GetCustomerByIdUseCase } from '@application/usecases/customer/get-customer-by-id.use-case';
import { GetCustomersUseCase } from '@application/usecases/customer/get-customers.use-case';
import { UpdateCustomerUseCase } from '@application/usecases/customer/update-customer.use-case';
import type { CustomerEntity } from '@domain/entities/customer.entity';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@presentation/dtos/common/pagination-query.dto';
import { CreateCustomerDto } from '@presentation/dtos/customer/create-customer.dto';
import { UpdateCustomerDto } from '@presentation/dtos/customer/update-customer.dto';

@ApiTags('Customers')
@ApiBadRequestResponse({ description: 'Payload ou query string inválidos (falha de validação).' })
@ApiTooManyRequestsResponse({ description: 'Limite de requisições excedido.' })
@ApiInternalServerErrorResponse({ description: 'Erro interno não tratado.' })
@Controller('/customers')
export class CustomersController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomersUseCase: GetCustomersUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar cliente',
    description:
      'CPF e telefone são normalizados automaticamente (aceitos com ou sem máscara) e o CPF é validado por dígito verificador. Todos os `authorizedTransportTypeIds` devem existir.',
  })
  @ApiCreatedResponse({ description: 'Cliente criado.' })
  @ApiUnprocessableEntityResponse({
    description: 'Documento já cadastrado ou tipo de transporte inexistente.',
  })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerEntity> {
    return this.createCustomerUseCase.execute({
      name: dto.name,
      document: dto.document,
      email: dto.email,
      phone: dto.phone,
      authorizedTransportTypeIds: dto.authorizedTransportTypeIds,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar cliente',
    description:
      'Campos omitidos preservam o valor atual. O documento (CPF) é imutável após a criação. Enviar `authorizedTransportTypeIds` substitui a lista inteira.',
  })
  @ApiParam({ name: 'id', description: 'UUID do cliente.' })
  @ApiOkResponse({ description: 'Cliente atualizado.' })
  @ApiUnprocessableEntityResponse({
    description: 'Cliente não encontrado ou tipo de transporte inexistente.',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto): Promise<CustomerEntity> {
    return this.updateCustomerUseCase.execute({
      id,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      authorizedTransportTypeIds: dto.authorizedTransportTypeIds,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar clientes',
    description: 'Paginado. Sem `limit`, retorna 50 registros; o máximo permitido é 100.',
  })
  @ApiOkResponse({ description: 'Página de clientes.' })
  async findAll(@Query() query: PaginationQueryDto): Promise<CustomerEntity[]> {
    return this.getCustomersUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiParam({ name: 'id', description: 'UUID do cliente.' })
  @ApiOkResponse({ description: 'Cliente encontrado.' })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
  async findById(@Param('id') id: string): Promise<CustomerEntity> {
    return this.getCustomerByIdUseCase.execute(id);
  }
}
