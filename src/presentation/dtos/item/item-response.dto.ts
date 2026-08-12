import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Representação de um item de catálogo nas respostas da API. Não é instanciada em runtime. */
export class ItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare id: string;

  @ApiProperty({ example: 'SKU-001', description: 'Identificador único do item no catálogo.' })
  declare sku: string;

  @ApiProperty({ example: 'Caixa de papelão' })
  declare name: string;

  @ApiPropertyOptional({ example: 'Caixa 50x50x50cm' })
  declare description?: string;

  @ApiProperty({ example: 29.9, description: 'Preço unitário vigente no catálogo.' })
  declare unitPrice: number;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;
}
