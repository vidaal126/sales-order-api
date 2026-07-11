import { ChangeSalesOrderTransportUseCase } from '@application/usecases/sales-order/change-sales-order-transport.use-case';
import { CreateSalesOrderUseCase } from '@application/usecases/sales-order/create-sales-order.use-case';
import { GetSalesOrderByIdUseCase } from '@application/usecases/sales-order/get-sales-order-by-id.use-case';
import { GetSalesOrdersUseCase } from '@application/usecases/sales-order/get-sales-orders.use-case';
import { RescheduleDeliveryUseCase } from '@application/usecases/sales-order/reschedule-delivery.use-case';
import { ScheduleDeliveryUseCase } from '@application/usecases/sales-order/schedule-delivery.use-case';
import { UpdateSalesOrderStatusUseCase } from '@application/usecases/sales-order/update-sales-order-status.use-case';
import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type { SchedulingEntity } from '@domain/entities/scheduling.entity';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangeSalesOrderTransportDto } from '@presentation/dtos/sales-order/change-sales-order-transport.dto';
import { CreateSalesOrderDto } from '@presentation/dtos/sales-order/create-sales-order.dto';
import { GetSalesOrdersQueryDto } from '@presentation/dtos/sales-order/get-sales-orders-query.dto';
import { RescheduleDeliveryDto } from '@presentation/dtos/sales-order/reschedule-delivery.dto';
import { ScheduleDeliveryDto } from '@presentation/dtos/sales-order/schedule-delivery.dto';
import { UpdateSalesOrderStatusDto } from '@presentation/dtos/sales-order/update-sales-order-status.dto';

@ApiTags('Sales Orders')
@Controller('/sales-orders')
export class SalesOrdersController {
  constructor(
    private readonly createSalesOrderUseCase: CreateSalesOrderUseCase,
    private readonly updateSalesOrderStatusUseCase: UpdateSalesOrderStatusUseCase,
    private readonly getSalesOrdersUseCase: GetSalesOrdersUseCase,
    private readonly getSalesOrderByIdUseCase: GetSalesOrderByIdUseCase,
    private readonly scheduleDeliveryUseCase: ScheduleDeliveryUseCase,
    private readonly rescheduleDeliveryUseCase: RescheduleDeliveryUseCase,
    private readonly changeSalesOrderTransportUseCase: ChangeSalesOrderTransportUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar ordem de venda' })
  async create(@Body() dto: CreateSalesOrderDto): Promise<SalesOrderEntity> {
    return this.createSalesOrderUseCase.execute({
      customerId: dto.customerId,
      transportTypeId: dto.transportTypeId,
      notes: dto.notes,
      items: dto.items.map((item): { itemId: string; quantity: number } => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar ordens de venda' })
  async findAll(@Query() query: GetSalesOrdersQueryDto): Promise<SalesOrderEntity[]> {
    return this.getSalesOrdersUseCase.execute({
      status: query.status,
      customerId: query.customerId,
      transportTypeId: query.transportTypeId,
      itemId: query.itemId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ordem de venda por ID' })
  async findById(@Param('id') id: string): Promise<SalesOrderEntity> {
    return this.getSalesOrderByIdUseCase.execute(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status da ordem de venda' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderStatusDto,
  ): Promise<SalesOrderEntity> {
    return this.updateSalesOrderStatusUseCase.execute({
      orderId: id,
      newStatus: dto.status,
    });
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Agendar entrega' })
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleDeliveryDto,
  ): Promise<SchedulingEntity> {
    return this.scheduleDeliveryUseCase.execute({
      salesOrderId: id,
      deliveryDate: new Date(dto.deliveryDate),
      windowStart: new Date(dto.windowStart),
      windowEnd: new Date(dto.windowEnd),
    });
  }

  @Put(':id/schedule')
  @ApiOperation({ summary: 'Reagendar entrega' })
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleDeliveryDto,
  ): Promise<SchedulingEntity> {
    return this.rescheduleDeliveryUseCase.execute({
      salesOrderId: id,
      deliveryDate: new Date(dto.deliveryDate),
      windowStart: new Date(dto.windowStart),
      windowEnd: new Date(dto.windowEnd),
    });
  }

  @Put(':id/transport')
  @ApiOperation({ summary: 'Alterar transporte da ordem de venda' })
  async changeTransport(
    @Param('id') id: string,
    @Body() dto: ChangeSalesOrderTransportDto,
  ): Promise<SalesOrderEntity> {
    return this.changeSalesOrderTransportUseCase.execute({
      salesOrderId: id,
      transportTypeId: dto.transportTypeId,
    });
  }
}
