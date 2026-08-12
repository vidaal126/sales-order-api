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
import { ChangeSalesOrderTransportDto } from '@presentation/dtos/sales-order/change-sales-order-transport.dto';
import { CreateSalesOrderDto } from '@presentation/dtos/sales-order/create-sales-order.dto';
import { GetSalesOrdersQueryDto } from '@presentation/dtos/sales-order/get-sales-orders-query.dto';
import { RescheduleDeliveryDto } from '@presentation/dtos/sales-order/reschedule-delivery.dto';
import { ScheduleDeliveryDto } from '@presentation/dtos/sales-order/schedule-delivery.dto';
import { UpdateSalesOrderStatusDto } from '@presentation/dtos/sales-order/update-sales-order-status.dto';

@ApiTags('Sales Orders')
@ApiBadRequestResponse({ description: 'Payload ou query string inválidos (falha de validação).' })
@ApiTooManyRequestsResponse({ description: 'Limite de requisições excedido.' })
@ApiInternalServerErrorResponse({ description: 'Erro interno não tratado.' })
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
  @ApiOperation({
    summary: 'Criar ordem de venda',
    description:
      'A ordem nasce no status CRIADA e exige ao menos um item, sem itens repetidos. O tipo de transporte precisa estar autorizado para o cliente. Cliente, itens e ordem são lidos e gravados na mesma transação; o evento `order.created` só é emitido após o commit.',
  })
  @ApiCreatedResponse({ description: 'Ordem de venda criada com status CRIADA.' })
  @ApiUnprocessableEntityResponse({
    description:
      'Cliente ou item inexistente, item repetido no pedido, ou transporte não autorizado para o cliente.',
  })
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
  @ApiOperation({
    summary: 'Listar ordens de venda',
    description:
      'Todos os filtros são opcionais e combináveis. `dateFrom`/`dateTo` filtram pela data de criação e `dateTo` não pode ser anterior a `dateFrom`. Paginado: sem `limit`, retorna 50 registros; o máximo permitido é 100.',
  })
  @ApiOkResponse({ description: 'Página de ordens de venda que atendem aos filtros.' })
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
  @ApiOperation({
    summary: 'Buscar ordem de venda por ID',
    description: 'Retorna a ordem com seus itens e o agendamento associado, quando houver.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de venda.' })
  @ApiOkResponse({ description: 'Ordem de venda encontrada.' })
  @ApiNotFoundResponse({ description: 'Ordem de venda não encontrada.' })
  async findById(@Param('id') id: string): Promise<SalesOrderEntity> {
    return this.getSalesOrderByIdUseCase.execute(id);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Atualizar status da ordem de venda',
    description:
      'Avança um único passo na máquina de estados: CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE. Saltos, retrocessos e transições a partir de ENTREGUE são rejeitados. Emite `order.status.changed` para a auditoria.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de venda.' })
  @ApiOkResponse({ description: 'Status atualizado.' })
  @ApiNotFoundResponse({ description: 'Ordem de venda não encontrada.' })
  @ApiUnprocessableEntityResponse({
    description: 'Transição de status inválida a partir do status atual.',
  })
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
  @ApiOperation({
    summary: 'Agendar entrega',
    description:
      'Só é permitido para ordens em PLANEJADA e sem agendamento anterior; em caso de sucesso a ordem passa para AGENDADA. A janela precisa começar no futuro, terminar depois de começar, ocorrer no mesmo dia (UTC) de `deliveryDate`, e `deliveryDate` não pode exceder 365 dias a partir de agora.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de venda.' })
  @ApiCreatedResponse({ description: 'Entrega agendada e ordem movida para AGENDADA.' })
  @ApiNotFoundResponse({ description: 'Ordem de venda não encontrada.' })
  @ApiUnprocessableEntityResponse({
    description:
      'Ordem já agendada, status atual não permite agendamento, ou janela de entrega inválida.',
  })
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
  @ApiOperation({
    summary: 'Reagendar entrega',
    description:
      'Só é permitido para ordens em AGENDADA que já possuam agendamento — ordens EM_TRANSPORTE ou ENTREGUE não podem ter a data alterada. A nova janela passa pelas mesmas validações do agendamento.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de venda.' })
  @ApiOkResponse({ description: 'Entrega reagendada.' })
  @ApiNotFoundResponse({ description: 'Ordem de venda ou agendamento não encontrado.' })
  @ApiUnprocessableEntityResponse({
    description: 'Ordem fora do status AGENDADA ou janela de entrega inválida.',
  })
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
  @ApiOperation({
    summary: 'Alterar transporte da ordem de venda',
    description:
      'O novo tipo de transporte precisa estar autorizado para o cliente da ordem. Bloqueado para ordens em EM_TRANSPORTE ou ENTREGUE. Emite `order.transport.changed` para a auditoria.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de venda.' })
  @ApiOkResponse({ description: 'Transporte da ordem alterado.' })
  @ApiNotFoundResponse({ description: 'Ordem de venda ou cliente não encontrado.' })
  @ApiUnprocessableEntityResponse({
    description:
      'Ordem em EM_TRANSPORTE/ENTREGUE, ou transporte não autorizado para o cliente da ordem.',
  })
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
