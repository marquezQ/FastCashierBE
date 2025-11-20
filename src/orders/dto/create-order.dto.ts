import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @IsNumber()
  @IsNotEmpty()
  cashierId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  subtotal: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  total: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['CASH', 'QR'], {
    message: 'Payment method must be CASH or QR',
  })
  paymentMethod: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amountPaid: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customer?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
