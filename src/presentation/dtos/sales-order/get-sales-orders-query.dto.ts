import { OrderStatus } from '@domain/enums/order-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@presentation/dtos/common/pagination-query.dto';
import { IsDateAfterOrEqual } from '@presentation/validators/is-date-after-or-equal.validator';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GetSalesOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  transportTypeId?: string;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  itemId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsDateAfterOrEqual('dateFrom')
  @IsOptional()
  dateTo?: string;
}
