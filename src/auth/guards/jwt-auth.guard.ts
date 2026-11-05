import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { User } from '../../sessions/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado. Se requiere cabecera Authorization: Bearer <token>',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: { rol: true, facultades: true },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario asociado al token no encontrado.');
      }

      if (!user.estadoActivo) {
        throw new UnauthorizedException('La cuenta de usuario está desactivada.');
      }

      // Inyectar el usuario autenticado en la petición
      request.user = user;
      return true;
    } catch (error) {
      if (isPublic) {
        return true;
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    // Soporte para x-access-token o query param de conveniencia
    return request.headers?.['x-access-token'] || request.query?.token;
  }
}

