import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'BEBIDAS',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de la categoría',
    example: 'Bebidas frías y calientes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen de la categoría',
    example: 'https://example.com/bebidas.jpg',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Orden de visualización',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({
    description: 'Estado de la categoría',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}