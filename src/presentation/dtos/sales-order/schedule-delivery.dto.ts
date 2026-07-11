import { ApiProperty } from '@nestjs/swagger';
import { IsNotPastDate } from '@presentation/validators/is-not-past-date.validator';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ScheduleDeliveryDto {
  @ApiProperty({ example: '2026-06-20' })
  @IsDateString()
  @IsNotEmpty()
  @IsNotPastDate()
  deliveryDate!: string;

  @ApiProperty({ example: '2026-06-20T08:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  @IsNotPastDate()
  windowStart!: string;

  @ApiProperty({ example: '2026-06-20T12:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  @IsNotPastDate()
  windowEnd!: string;
}
