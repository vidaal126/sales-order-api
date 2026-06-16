import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTransportTypeDto {
  @ApiPropertyOptional({ example: 'Caminhão' })
  @IsString() @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Caminhão de médio porte' })
  @IsString() @IsOptional()
  description?: string;
}
