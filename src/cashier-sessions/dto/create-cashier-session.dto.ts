import { IsNotEmpty, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCashierSessionDto {
  @ApiProperty({ description: 'ID of the user (cashier) opening the session', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'Initial amount of cash in the register', example: 100.0 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  initialAmount: number;

  @ApiPropertyOptional({
    description: 'Optional observations when opening the session',
    example: 'Morning shift',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
