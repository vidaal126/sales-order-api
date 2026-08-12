import { normalizeCpf, normalizePhone } from '@common/utils/normalization';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCpf } from '@presentation/validators/is-cpf.validator';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '123.456.789-09' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }): unknown => normalizeCpf(value))
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'document must be a valid CPF in the format XXX.XXX.XXX-XX',
  })
  @IsCpf()
  document!: string;

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

  @ApiProperty({ example: [] })
  @IsArray()
  @IsUUID('4', { each: true })
  authorizedTransportTypeIds!: string[];
}
