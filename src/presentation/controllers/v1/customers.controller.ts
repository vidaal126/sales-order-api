import { CreateCustomerUseCase } from '@application/usecases/customer/create-customer.use-case';
import { GetCustomerByIdUseCase } from '@application/usecases/customer/get-customer-by-id.use-case';
import { GetCustomersUseCase } from '@application/usecases/customer/get-customers.use-case';
import { UpdateCustomerUseCase } from '@application/usecases/customer/update-customer.use-case';
import type { CustomerEntity } from '@domain/entities/customer.entity';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '@presentation/dtos/common/pagination-query.dto';
import { CreateCustomerDto } from '@presentation/dtos/customer/create-customer.dto';
import { UpdateCustomerDto } from '@presentation/dtos/customer/update-customer.dto';

@ApiTags('Customers')
@Controller('/customers')
export class CustomersController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomersUseCase: GetCustomersUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar cliente' })
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
  @ApiOperation({ summary: 'Atualizar cliente' })
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
  @ApiOperation({ summary: 'Listar clientes' })
  async findAll(@Query() query: PaginationQueryDto): Promise<CustomerEntity[]> {
    return this.getCustomersUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  async findById(@Param('id') id: string): Promise<CustomerEntity> {
    return this.getCustomerByIdUseCase.execute(id);
  }
}
