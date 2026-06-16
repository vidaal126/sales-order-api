import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ScheduleDeliveryDto {
  @ApiProperty({ example: '2026-06-20' })
  @IsDateString()
  @IsNotEmpty()
  deliveryDate!: string;

  @ApiProperty({ example: '2026-06-20T08:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  windowStart!: string;

  @ApiProperty({ example: '2026-06-20T12:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  windowEnd!: string;
}
