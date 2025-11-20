import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED'], {
    message:
      'Status must be: PENDING, IN_PREPARATION, READY, DELIVERED or CANCELLED',
  })
  orderStatus: string;

  @IsOptional()
  @IsNumber()
  cookId?: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
