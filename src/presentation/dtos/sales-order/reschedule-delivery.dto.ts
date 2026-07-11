import { ApiProperty } from '@nestjs/swagger';
import { IsNotPastDate } from '@presentation/validators/is-not-past-date.validator';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleDeliveryDto {
  @ApiProperty({ example: '2026-06-25' })
  @IsDateString()
  @IsNotEmpty()
  @IsNotPastDate()
  deliveryDate!: string;

  @ApiProperty({ example: '2026-06-25T13:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  @IsNotPastDate()
  windowStart!: string;

  @ApiProperty({ example: '2026-06-25T18:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  @IsNotPastDate()
  windowEnd!: string;
}
