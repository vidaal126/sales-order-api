import { OrderStatus } from '@domain/enums/order-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateSalesOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PLANEJADA })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
