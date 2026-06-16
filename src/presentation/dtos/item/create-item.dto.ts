import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 'SKU-001' })
  @IsString() @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 'Caixa de papelão' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Caixa 50x50x50cm' })
  @IsString() @IsOptional()
  description?: string;

  @ApiProperty({ example: 29.90 })
  @IsNumber() @IsPositive()
  unitPrice!: number;
}
