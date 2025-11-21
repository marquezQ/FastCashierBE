import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { CreateOrderDetailDto } from '../../order-details/dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @IsNumber()
  @IsNotEmpty()
  cashierId: number;

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

  // ✨ NUEVO: Array de items
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  items: CreateOrderDetailDto[];
}
