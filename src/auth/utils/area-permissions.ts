import { ForbiddenException } from '@nestjs/common';
import { User } from '../../sessions/user.entity';
import { RoleId, RoleName } from '../constants/roles.enum';

/**
 * Valida si un usuario tiene permiso para crear, editar o eliminar
 * un recurso (aviso o guía) asignado a una facultad / área determinada.
 *
 * Matriz de acceso:
 * - Administrador: Acceso total global
 * - Coordinación / Administrativo: Acceso a sus facultades asignadas (+ historial)
 * - Docente / Encargado de Área: Acceso a sus facultades / áreas asignadas
 * - Estudiante: No puede gestionar avisos ni guías
 */
export function validarPermisoFacultadOArea(
  user: User,
  recursoFacultadId?: number,
  recursoArea?: string,
): void {
  if (!user) {
    throw new ForbiddenException('No hay información de usuario autenticado para validar permisos.');
  }

  // 1. Administrador: Acceso global irrestricto
  if (user.rolId === RoleId.ADMIN || user.rol?.nombre === RoleName.ADMIN) {
    return;
  }

  // 2. Estudiante: No puede crear ni editar avisos ni guías
  if (user.rolId === RoleId.ESTUDIANTE || user.rol?.nombre === RoleName.ESTUDIANTE) {
    throw new ForbiddenException(
      'Los estudiantes no tienen permisos para crear o modificar avisos ni guías institucionales.',
    );
  }

  // 3. Docente o Coordinador: Solo en sus facultades o áreas asignadas
  const esDocenteOCoordinador =
    user.rolId === RoleId.DOCENTE ||
    user.rolId === RoleId.COORDINADOR ||
    user.rol?.nombre === RoleName.DOCENTE ||
    user.rol?.nombre === RoleName.COORDINADOR;

  if (esDocenteOCoordinador) {
    // Si el aviso o guía pertenece a una facultad específica, el usuario debe tener esa facultad
    if (recursoFacultadId) {
      const facultadesUsuario = user.facultades || [];
      const perteneceAFacultad = facultadesUsuario.some((f) => f.id === recursoFacultadId);

      if (!perteneceAFacultad) {
        throw new ForbiddenException(
          `No tienes permisos en la facultad con ID ${recursoFacultadId}. Solo puedes gestionar contenido de tus facultades asignadas.`,
        );
      }
    }

    // Si el recurso y el usuario especifican un área, validar coincidencia
    if (recursoArea && user.area && user.area.trim().toLowerCase() !== recursoArea.trim().toLowerCase()) {
      throw new ForbiddenException(
        `No tienes permisos en el área "${recursoArea}". Tu área asignada es "${user.area}".`,
      );
    }

    return;
  }

  throw new ForbiddenException('No tienes permisos suficientes para realizar esta acción.');
}

