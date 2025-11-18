import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCashierSessionDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  initialAmount: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
