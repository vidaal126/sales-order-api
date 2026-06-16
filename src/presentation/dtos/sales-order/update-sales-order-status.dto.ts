import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@domain/enums/order-status.enum';

export class UpdateSalesOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PLANEJADA })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
