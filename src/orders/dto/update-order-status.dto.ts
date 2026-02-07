import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New status of the order',
    enum: ['PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED'],
    example: 'IN_PREPARATION',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED'], {
    message:
      'Status must be: PENDING, IN_PREPARATION, READY, DELIVERED or CANCELLED',
  })
  orderStatus: string;

  @ApiProperty({
    description: 'ID of the cook handling the order (required for IN_PREPARATION)',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  cookId?: number;

  @ApiProperty({
    description: 'Optional observations for the status change',
    example: 'Short on salt',
    required: false,
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
