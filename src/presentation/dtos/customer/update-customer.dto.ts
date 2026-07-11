import { normalizePhone } from '@common/utils/normalization';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '(61) 99999-9999' })
  @IsString()
  @Transform(({ value }): unknown => normalizePhone(value))
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, {
    message: 'phone must be in the format (XX) XXXXX-XXXX',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: [] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  authorizedTransportTypeIds?: string[];
}
