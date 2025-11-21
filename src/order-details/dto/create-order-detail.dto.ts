import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateOrderDetailDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}
