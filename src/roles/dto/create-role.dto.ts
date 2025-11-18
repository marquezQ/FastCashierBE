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
  @IsIn(['ADMIN', 'CASHIER', 'KITCHEN'], {
    message: 'Role must be: ADMIN, CASHIER or KITCHEN',
  })
  roleName: string;

  @IsOptional()
  @IsString()
  description?: string;
}
