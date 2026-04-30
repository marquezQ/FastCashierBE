import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDisplayConfigDto } from './create-display-config.dto';

export class UpdateDisplayConfigDto extends PartialType(CreateDisplayConfigDto) {
  @ApiPropertyOptional({
    description: 'Estado activo de la configuración',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
