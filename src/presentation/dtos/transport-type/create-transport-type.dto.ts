import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTransportTypeDto {
  @ApiProperty({ example: 'Caminhão' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Caminhão de médio porte' })
  @IsString() @IsOptional()
  description?: string;
}
