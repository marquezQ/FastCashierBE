import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseCashierSessionDto {
  @ApiProperty({ description: 'Total cash amount at closing', example: 500.5 })
  @IsNumber()
  @IsNotEmpty()
  closingCashAmount: number;

  @ApiProperty({ description: 'Total QR payments amount at closing', example: 200.0 })
  @IsNumber()
  @IsNotEmpty()
  closingQrAmount: number;

  @ApiPropertyOptional({
    description: 'Optional observations when closing the session',
    example: 'Everything correct',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
