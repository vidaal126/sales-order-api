import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleDeliveryDto {
  @ApiProperty({ example: '2026-06-25' })
  @IsDateString() @IsNotEmpty()
  deliveryDate!: string;

  @ApiProperty({ example: '2026-06-25T13:00:00Z' })
  @IsDateString() @IsNotEmpty()
  windowStart!: string;

  @ApiProperty({ example: '2026-06-25T18:00:00Z' })
  @IsDateString() @IsNotEmpty()
  windowEnd!: string;
}
