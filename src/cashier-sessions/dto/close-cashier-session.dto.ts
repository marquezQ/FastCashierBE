import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CloseCashierSessionDto {
  @ApiProperty({ description: 'Total cash amount at closing', example: 500.50 })
  @IsNumber()
  @IsNotEmpty()
  closingCashAmount: number;

  @ApiProperty({ description: 'Date and time when the session is closed (local time from frontend)', example: '2024-03-20T17:00:00Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  closingDate: Date;

  @ApiProperty({ description: 'Total QR payments amount at closing', example: 200.00 })
  @IsNumber()
  @IsNotEmpty()
  closingQrAmount: number;

  @ApiPropertyOptional({ description: 'Optional observations when closing the session', example: 'Everything correct' })
  @IsOptional()
  @IsString()
  observations?: string;
}
