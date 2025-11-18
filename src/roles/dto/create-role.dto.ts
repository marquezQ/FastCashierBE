import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsIn(['ADMINISTRADOR', 'CAJERO', 'COCINA'], {
    message: 'El rol debe ser: ADMINISTRADOR, CAJERO o COCINA',
  })
  nombreRol: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
