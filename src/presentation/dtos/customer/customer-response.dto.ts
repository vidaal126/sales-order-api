import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Representação de um cliente nas respostas da API. Não é instanciada em runtime. */
export class CustomerResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare id: string;

  @ApiProperty({ example: 'João Silva' })
  declare name: string;

  @ApiProperty({
    example: '123.456.789-09',
    description: 'CPF normalizado para XXX.XXX.XXX-XX. Imutável após a criação.',
  })
  declare document: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  declare email?: string;

  @ApiPropertyOptional({ example: '(61) 99999-9999', description: 'Telefone normalizado.' })
  declare phone?: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Tipos de transporte que este cliente pode usar em suas ordens de venda.',
  })
  declare authorizedTransportTypeIds: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
