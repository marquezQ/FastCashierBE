import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Código único del producto',
    example: 'PROD-001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Hamburguesa con queso',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del producto',
    example: 'Hamburguesa de carne con queso cheddar, lechuga y tomate',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 25.50,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idCategory?: number;

  @ApiPropertyOptional({
    description: 'URL de la imagen del producto',
    example: 'https://example.com/hamburguesa.jpg',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Estado del producto',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
