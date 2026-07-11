import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangeSalesOrderTransportDto {
  @ApiProperty()
  @IsUUID('4')
  transportTypeId!: string;
}
