import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { RoleId, RoleName } from '../constants/roles.enum';
import { validarPermisoFacultadOArea } from '../utils/area-permissions';
import { User } from '../../sessions/user.entity';

describe('Seguridad, JWT y RBAC', () => {
  describe('validarPermisoFacultadOArea', () => {
    const adminUser = {
      id: 1,
      rolId: RoleId.ADMIN,
      rol: { id: 1, nombre: RoleName.ADMIN },
      facultades: [{ id: 10, nombre: 'Facultad de Informática' }],
    } as unknown as User;

    const docenteFIF = {
      id: 2,
      rolId: RoleId.DOCENTE,
      rol: { id: 3, nombre: RoleName.DOCENTE },
      facultades: [{ id: 1, nombre: 'Facultad de Informática' }],
      area: 'Desarrollo de Software',
    } as unknown as User;

    const estudiante = {
      id: 3,
      rolId: RoleId.ESTUDIANTE,
      rol: { id: 2, nombre: RoleName.ESTUDIANTE },
      facultades: [{ id: 1, nombre: 'Facultad de Informática' }],
    } as unknown as User;

    it('Administrador debe tener acceso global a cualquier facultad', () => {
      expect(() => validarPermisoFacultadOArea(adminUser, 999)).not.toThrow();
    });

    it('Docente debe tener acceso únicamente a su facultad asignada', () => {
      // Facultad asignada (1) -> permitido
      expect(() => validarPermisoFacultadOArea(docenteFIF, 1)).not.toThrow();

      // Otra facultad (2) -> denegado
      expect(() => validarPermisoFacultadOArea(docenteFIF, 2)).toThrow(ForbiddenException);
    });

    it('Estudiante NO debe tener permisos para crear ni modificar avisos/guías', () => {
      expect(() => validarPermisoFacultadOArea(estudiante, 1)).toThrow(ForbiddenException);
    });
  });

  describe('RolesGuard', () => {
    let reflector: Reflector;
    let guard: RolesGuard;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    function mockContext(user: any): ExecutionContext {
      return {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as unknown as ExecutionContext;
    }

    it('Permite acceso si no hay roles requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = mockContext({ rol: { nombre: RoleName.ESTUDIANTE } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('Administrador siempre tiene acceso aunque no esté explícito', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.COORDINADOR]);
      const ctx = mockContext({ rolId: RoleId.ADMIN, rol: { nombre: RoleName.ADMIN } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('Rechaza si el usuario no cuenta con el rol requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.ADMIN, RoleName.COORDINADOR]);
      const ctx = mockContext({ rolId: RoleId.ESTUDIANTE, rol: { nombre: RoleName.ESTUDIANTE } });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('Permite si el usuario cuenta con uno de los roles permitidos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.DOCENTE, RoleName.COORDINADOR]);
      const ctx = mockContext({ rolId: RoleId.DOCENTE, rol: { nombre: RoleName.DOCENTE } });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('JwtAuthGuard', () => {
    let reflector: Reflector;
    let jwtService: any;
    let userRepository: any;
    let guard: JwtAuthGuard;

    beforeEach(() => {
      reflector = new Reflector();
      jwtService = { verifyAsync: jest.fn() };
      userRepository = { findOne: jest.fn() };
      guard = new JwtAuthGuard(reflector, jwtService, userRepository);
    });

    it('Lanza UnauthorizedException si no hay token en ruta privada', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('Permite acceso si la ruta es pública y no hay token', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const ctx = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('Valida token correctamente e inyecta usuario en la request', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue({ sub: 10 });
      const mockUser = { id: 10, estadoActivo: true, nombre: 'Alan', rol: { nombre: 'Estudiante' } };
      userRepository.findOne.mockResolvedValue(mockUser);

      const request: any = { headers: { authorization: 'Bearer token-valido' } };
      const ctx = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
    });
  });
});

