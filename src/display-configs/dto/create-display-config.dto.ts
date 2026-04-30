import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisplayConfigDto {
  @ApiProperty({
    description: 'Nombre de la configuración de pantalla',
    example: 'Pantalla Principal',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'ID de la categoría a mostrar (null = todos los productos)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @ApiPropertyOptional({
    description: 'Segundos por slide de rotación (3-60)',
    example: 8,
    default: 8,
    minimum: 3,
    maximum: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(60)
  rotationInterval?: number;

  @ApiPropertyOptional({
    description: 'Tipo de transición entre slides',
    example: 'slide',
    default: 'slide',
    enum: ['slide', 'fade', 'zoom'],
  })
  @IsOptional()
  @IsIn(['slide', 'fade', 'zoom'])
  transitionType?: string;

  @ApiPropertyOptional({
    description: 'Mostrar precios en la pantalla',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showPrices?: boolean;

  @ApiPropertyOptional({
    description: 'Mostrar descripciones en la pantalla',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showDescriptions?: boolean;

  @ApiPropertyOptional({
    description: 'Cantidad de productos por slide (1-6)',
    example: 3,
    default: 3,
    minimum: 1,
    maximum: 6,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  productsPerSlide?: number;
}
