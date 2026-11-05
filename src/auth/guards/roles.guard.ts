import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName, RoleId } from '../constants/roles.enum';
import { User } from '../../sessions/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no especifica ningún rol, se permite el paso (JwtAuthGuard ya validó la autenticación)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user }: { user?: User } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('No hay información de usuario autenticado para validar permisos.');
    }

    // El Administrador (rolId 1 o nombre Administrador) tiene acceso total universal
    if (user.rolId === RoleId.ADMIN || user.rol?.nombre === RoleName.ADMIN) {
      return true;
    }

    const userRoleName = user.rol?.nombre;
    const hasRole = requiredRoles.some((role) => role === userRoleName);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado: tu rol (${userRoleName || 'Sin rol'}) no tiene permisos para esta acción. Roles permitidos: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

