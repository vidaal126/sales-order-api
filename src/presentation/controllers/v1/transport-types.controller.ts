import { CreateTransportTypeUseCase } from '@application/usecases/transport-type/create-transport-type.use-case';
import { GetTransportTypesUseCase } from '@application/usecases/transport-type/get-transport-types.use-case';
import { UpdateTransportTypeUseCase } from '@application/usecases/transport-type/update-transport-type.use-case';
import type { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTransportTypeDto } from '@presentation/dtos/transport-type/create-transport-type.dto';
import { UpdateTransportTypeDto } from '@presentation/dtos/transport-type/update-transport-type.dto';

@ApiTags('Transport Types')
@Controller('transport-types')
export class TransportTypesController {
  constructor(
    private readonly createTransportTypeUseCase: CreateTransportTypeUseCase,
    private readonly updateTransportTypeUseCase: UpdateTransportTypeUseCase,
    private readonly getTransportTypesUseCase: GetTransportTypesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar tipo de transporte' })
  async create(@Body() dto: CreateTransportTypeDto): Promise<TransportTypeEntity> {
    return this.createTransportTypeUseCase.execute({
      name: dto.name,
      description: dto.description,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tipo de transporte' })
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
  async findAll(): Promise<TransportTypeEntity[]> {
    return this.getTransportTypesUseCase.execute();
  }
}
