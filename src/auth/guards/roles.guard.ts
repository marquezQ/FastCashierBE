import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si no hay roles requeridos, permitir acceso
    }

    const { user } = context.switchToHttp().getRequest();

    // Verificar si el usuario tiene alguno de los roles requeridos
    return requiredRoles.some((role) => user.roleId === this.getRoleId(role));
  }

  private getRoleId(roleName: string): number {
    const roleMap: { [key: string]: number } = {
      ADMIN: 1,
      CASHIER: 2,
      KITCHEN: 3,
    };
    return roleMap[roleName];
  }
}
