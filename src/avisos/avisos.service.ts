import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aviso, NivelUrgencia, EstadoModeracion } from './entities/aviso.entity';
import { LecturaAviso } from './entities/lectura-aviso.entity';
import { User } from '../sessions/user.entity';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { RoleId, RoleName } from '../auth/constants/roles.enum';
import { validarPermisoFacultadOArea } from '../auth/utils/area-permissions';

@Injectable()
export class AvisosService {
  constructor(
    @InjectRepository(Aviso)
    private readonly avisoRepository: Repository<Aviso>,
    @InjectRepository(LecturaAviso)
    private readonly lecturaAvisoRepository: Repository<LecturaAviso>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Obtiene y valida a un usuario para operaciones con RBAC y facultades/áreas.
   */
  async obtenerYValidarUsuario(usuarioId?: number): Promise<User> {
    if (!usuarioId) {
      throw new BadRequestException(
        'Se requiere la identificación del usuario para verificar sus permisos de acceso.',
      );
    }

    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: { rol: true, facultades: true },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    if (!usuario.estadoActivo) {
      throw new ForbiddenException('La cuenta del usuario está desactivada.');
    }

    return usuario;
  }

  async create(
    createAvisoDto: CreateAvisoDto,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<Aviso> {
    const user =
      userAutenticado ||
      (await this.obtenerYValidarUsuario(usuarioId ?? createAvisoDto.autorId));

    // Validar permisos por rol y área/facultad:
    // - Administrador: Acceso global
    // - Docente / Coordinación: Solo en sus facultades asignadas
    // - Estudiante: No tiene permisos de publicación
    validarPermisoFacultadOArea(user, createAvisoDto.facultadId);

    const { usuarioId: _uid, ...datosAviso } = createAvisoDto;
    const aviso = this.avisoRepository.create({
      ...datosAviso,
      autorId: user.id,
    });
    return await this.avisoRepository.save(aviso);
  }

  async findAll(filters?: {
    facultadId?: number;
    autorId?: number;
    urgencia?: NivelUrgencia;
    estadoPublicacion?: EstadoModeracion;
  }): Promise<Aviso[]> {
    const where: any = {};

    if (filters?.facultadId) {
      where.facultadId = filters.facultadId;
    }
    if (filters?.autorId) {
      where.autorId = filters.autorId;
    }
    if (filters?.urgencia) {
      where.urgencia = filters.urgencia;
    }
    if (filters?.estadoPublicacion) {
      where.estadoPublicacion = filters.estadoPublicacion;
    }

    return await this.avisoRepository.find({
      where,
      relations: {
        autor: true,
        facultad: true,
      },
      order: {
        fechaPublicacion: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Aviso> {
    const aviso = await this.avisoRepository.findOne({
      where: { id },
      relations: {
        autor: true,
        facultad: true,
      },
    });

    if (!aviso) {
      throw new NotFoundException(`Aviso con ID ${id} no encontrado`);
    }

    return aviso;
  }

  async update(
    id: number,
    updateAvisoDto: UpdateAvisoDto,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<Aviso> {
    const user =
      userAutenticado ||
      (await this.obtenerYValidarUsuario(usuarioId ?? updateAvisoDto.usuarioId));
    const aviso = await this.findOne(id);

    // Validar permisos por rol y área/facultad sobre el aviso original o nueva facultad
    validarPermisoFacultadOArea(user, updateAvisoDto.facultadId || aviso.facultadId);

    const { usuarioId: _uid, ...datosActualizar } = updateAvisoDto;
    Object.assign(aviso, datosActualizar);
    return await this.avisoRepository.save(aviso);
  }

  async remove(
    id: number,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<{ message: string }> {
    const user =
      userAutenticado || (await this.obtenerYValidarUsuario(usuarioId));
    const aviso = await this.findOne(id);

    // Validar permisos por rol y área/facultad
    validarPermisoFacultadOArea(user, aviso.facultadId);

    await this.avisoRepository.remove(aviso);
    return { message: `Aviso con ID ${id} eliminado correctamente` };
  }

  // ==========================================
  // CONFIRMACIÓN Y ESTADO DE LECTURA DE AVISOS
  // ==========================================

  async marcarComoLeido(
    avisoId: number,
    usuarioId: number,
  ): Promise<{ message: string; yaLeido: boolean; lectura: LecturaAviso }> {
    await this.findOne(avisoId);

    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    const lecturaExistente = await this.lecturaAvisoRepository.findOne({
      where: { avisoId, usuarioId },
    });

    if (lecturaExistente) {
      return {
        message: 'El aviso ya había sido marcado como leído',
        yaLeido: true,
        lectura: lecturaExistente,
      };
    }

    const nuevaLectura = this.lecturaAvisoRepository.create({
      avisoId,
      usuarioId,
    });

    const lecturaGuardada = await this.lecturaAvisoRepository.save(nuevaLectura);

    return {
      message: 'Aviso marcado como leído exitosamente',
      yaLeido: false,
      lectura: lecturaGuardada,
    };
  }

  async verificarLectura(
    avisoId: number,
    usuarioId: number,
  ): Promise<{
    avisoId: number;
    usuarioId: number;
    leido: boolean;
    fechaLectura: Date | null;
  }> {
    await this.findOne(avisoId);

    const lectura = await this.lecturaAvisoRepository.findOne({
      where: { avisoId, usuarioId },
    });

    return {
      avisoId,
      usuarioId,
      leido: !!lectura,
      fechaLectura: lectura ? lectura.fechaLectura : null,
    };
  }

  async obtenerLecturas(
    avisoId: number,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<{ totalLecturas: number; lecturas: LecturaAviso[] }> {
    if (usuarioId || userAutenticado) {
      const user =
        userAutenticado || (await this.obtenerYValidarUsuario(usuarioId));
      // Según la matriz, solo Coordinación y Administradores tienen acceso a moderación/historial de lecturas
      if (
        user.rolId === RoleId.ESTUDIANTE ||
        user.rolId === RoleId.DOCENTE ||
        user.rol?.nombre === RoleName.ESTUDIANTE ||
        user.rol?.nombre === RoleName.DOCENTE
      ) {
        throw new ForbiddenException(
          'Solo el personal de Coordinación y Administradores pueden auditar el historial de lecturas.',
        );
      }
    }

    await this.findOne(avisoId);

    const [lecturas, totalLecturas] = await this.lecturaAvisoRepository.findAndCount({
      where: { avisoId },
      relations: {
        usuario: true,
      },
      order: {
        fechaLectura: 'DESC',
      },
    });

    return {
      totalLecturas,
      lecturas,
    };
  }
}
