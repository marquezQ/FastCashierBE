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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderDetailDto } from '../../order-details/dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID de la sesión de caja activa',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @ApiProperty({
    description: 'ID del cajero que registra la orden',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  cashierId: number;

  @ApiProperty({
    description: 'Método de pago',
    example: 'CASH',
    enum: ['CASH', 'QR'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['CASH', 'QR'], {
    message: 'Payment method must be CASH or QR',
  })
  paymentMethod: string;

  @ApiProperty({
    description: 'Monto pagado por el cliente',
    example: 100.00,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amountPaid: number;

  @ApiPropertyOptional({
    description: 'Nombre del cliente (opcional)',
    example: 'Juan Pérez',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customer?: string;

  @ApiPropertyOptional({
    description: 'Observaciones de la orden',
    example: 'Sin cebolla, por favor',
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({
    description: 'Items de la orden (productos y cantidades)',
    type: [CreateOrderDetailDto],
    example: [
      { productId: 1, quantity: 2 },
      { productId: 3, quantity: 1 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  items: CreateOrderDetailDto[];
}
