import { OrderStatus } from '@domain/enums/order-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchedulingResponseDto } from '@presentation/dtos/sales-order/scheduling-response.dto';

/** Linha de item dentro de uma ordem de venda. Não é instanciada em runtime. */
export class SalesOrderItemResponseDto {
  @ApiPropertyOptional({ format: 'uuid' })
  declare id?: string;

  @ApiProperty({ format: 'uuid', description: 'Item do catálogo referenciado por esta linha.' })
  declare itemId: string;

  @ApiProperty({ example: 2 })
  declare quantity: number;

  @ApiProperty({
    example: 29.9,
    description: 'Preço do item congelado no momento da criação da ordem.',
  })
  declare unitPrice: number;
}

/** Representação de uma ordem de venda nas respostas da API. Não é instanciada em runtime. */
export class SalesOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare id: string;

  @ApiProperty({ format: 'uuid' })
  declare customerId: string;

  @ApiProperty({ format: 'uuid' })
  declare transportTypeId: string;

  @ApiProperty({
    enum: OrderStatus,
    description:
      'Avança um passo por vez: CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE.',
  })
  declare status: OrderStatus;

  @ApiPropertyOptional({ example: 'Entregar no período da manhã' })
  declare notes?: string;

  @ApiProperty({
    type: [SalesOrderItemResponseDto],
    description: 'Sempre contém ao menos um item.',
  })
  declare items: SalesOrderItemResponseDto[];

  @ApiPropertyOptional({
    type: SchedulingResponseDto,
    description: 'Presente apenas após a entrega ser agendada.',
  })
  declare scheduling?: SchedulingResponseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
