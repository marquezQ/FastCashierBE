import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CloseCashierSessionDto {
  @IsNumber()
  @IsNotEmpty()
  closingCashAmount: number;

  @IsNumber()
  @IsNotEmpty()
  closingQrAmount: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
