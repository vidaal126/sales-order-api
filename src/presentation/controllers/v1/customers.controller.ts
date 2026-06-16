import { CreateCustomerUseCase } from '@application/usecases/customer/create-customer.use-case';
import { GetCustomersUseCase } from '@application/usecases/customer/get-customers.use-case';
import { UpdateCustomerUseCase } from '@application/usecases/customer/update-customer.use-case';
import type { CustomerEntity } from '@domain/entities/customer.entity';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCustomerDto } from '@presentation/dtos/customer/create-customer.dto';
import { UpdateCustomerDto } from '@presentation/dtos/customer/update-customer.dto';

@ApiTags('Customers')
@Controller('/customers')
export class CustomersController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomersUseCase: GetCustomersUseCase,
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
  async findAll(): Promise<CustomerEntity[]> {
    return this.getCustomersUseCase.execute();
  }
}
