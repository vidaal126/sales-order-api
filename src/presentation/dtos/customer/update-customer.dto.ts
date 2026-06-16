import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsArray, IsUUID } from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsString() @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsEmail() @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '(61) 99999-9999' })
  @IsString() @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: [] })
  @IsArray() @IsUUID('4', { each: true }) @IsOptional()
  authorizedTransportTypeIds?: string[];
}
