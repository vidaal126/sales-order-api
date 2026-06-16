import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesOrderItemDto {
  @ApiProperty({ example: 'uuid-do-item' })
  @IsUUID('4')
  itemId!: string;

  @ApiProperty({ example: 2 })
  @IsInt() @IsPositive()
  quantity!: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ example: 'uuid-do-cliente' })
  @IsUUID('4')
  customerId!: string;

  @ApiProperty({ example: 'uuid-do-tipo-transporte' })
  @IsUUID('4')
  transportTypeId!: string;

  @ApiPropertyOptional({ example: 'Entregar no período da manhã' })
  @IsString() @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateSalesOrderItemDto] })
  @IsArray() @ValidateNested({ each: true })
  @Type((): typeof CreateSalesOrderItemDto => CreateSalesOrderItemDto)
  items!: CreateSalesOrderItemDto[];
}
