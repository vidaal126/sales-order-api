import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Representação de um tipo de transporte nas respostas da API. Não é instanciada em runtime. */
export class TransportTypeResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare id: string;

  @ApiProperty({ example: 'Caminhão', description: 'Único entre todos os tipos de transporte.' })
  declare name: string;

  @ApiPropertyOptional({ example: 'Caminhão de médio porte' })
  declare description?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
