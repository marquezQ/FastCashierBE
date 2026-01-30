import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCashierSessionDto {
  @ApiProperty({ description: 'ID of the user (cashier) opening the session', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'Date and time when the session is opened (local time from frontend)', example: '2024-03-20T08:00:00Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  openingDate: Date;

  @ApiProperty({ description: 'Initial amount of cash in the register', example: 100.00 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  initialAmount: number;

  @ApiPropertyOptional({ description: 'Optional observations when opening the session', example: 'Morning shift' })
  @IsOptional()
  @IsString()
  observations?: string;
}
