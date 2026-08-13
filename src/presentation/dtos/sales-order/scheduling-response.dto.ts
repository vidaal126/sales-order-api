import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Representação de um agendamento de entrega nas respostas da API. Não é instanciada em runtime. */
export class SchedulingResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare id: string;

  @ApiProperty({ format: 'uuid', description: 'Ordem de venda à qual este agendamento pertence.' })
  declare salesOrderId: string;

  @ApiProperty({ type: String, format: 'date-time', description: 'Data prevista para a entrega.' })
  declare deliveryDate: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Início da janela de atendimento — ocorre no mesmo dia (UTC) de deliveryDate.',
  })
  declare windowStart: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fim da janela de atendimento — sempre posterior a windowStart.',
  })
  declare windowEnd: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Preenchido no momento do agendamento inicial.',
  })
  declare confirmedAt?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Preenchido apenas se a entrega já foi reagendada ao menos uma vez.',
  })
  declare rescheduledAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
