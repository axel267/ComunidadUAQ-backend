import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Aviso, NivelUrgencia, EstadoModeracion } from './entities/aviso.entity';
import { LecturaAviso } from './entities/lectura-aviso.entity';
import { User } from '../sessions/user.entity';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { RoleId, RoleName } from '../auth/constants/roles.enum';
import { validarPermisoFacultadOArea } from '../auth/utils/area-permissions';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AvisosService {
  constructor(
    @InjectRepository(Aviso)
    private readonly avisoRepository: Repository<Aviso>,
    @InjectRepository(LecturaAviso)
    private readonly lecturaAvisoRepository: Repository<LecturaAviso>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
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
    const avisoGuardado = await this.avisoRepository.save(aviso);

    // Disparador de notificaciones por correo institucional para avisos urgentes
    if (
      avisoGuardado.urgencia === NivelUrgencia.ALTA ||
      avisoGuardado.urgencia === NivelUrgencia.URGENTE
    ) {
      // Enviar correo electronico institucional a la comunidad estudiantil y docente
      this.enviarNotificacionCorreoComunidad(avisoGuardado, user).catch((err) =>
        console.error('Error enviando correos de aviso:', err),
      );
    }

    return avisoGuardado;
  }

  /**
   * Busca los correos de los alumnos y docentes de la facultad y les envia el comunicado.
   */
  private async enviarNotificacionCorreoComunidad(
    aviso: Aviso,
    autor: User,
  ): Promise<void> {
    const query = this.userRepository
      .createQueryBuilder('usuario')
      .leftJoin('usuario.facultades', 'facultad')
      .where('usuario.estadoActivo = :activo', { activo: true });

    if (aviso.facultadId) {
      query.andWhere('facultad.id = :facultadId', { facultadId: aviso.facultadId });
    }

    const usuarios = await query.getMany();
    const correos = usuarios
      .map((u) => u.email)
      .filter((email) => email && email.includes('@'));

    if (correos.length > 0) {
      await this.mailService.sendAvisoNotification(correos, {
        id: aviso.id,
        titulo: aviso.titulo,
        contenido: aviso.contenido,
        urgencia: aviso.urgencia,
        autorNombre: autor.nombre,
      });
    }
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

  /**
   * Obtiene los avisos con prioridad ALTA o URGENTE que el usuario NO ha marcado como leidos.
   * Alimenta el modal bloqueante de Acuse de Recibo Obligatorio (RF06).
   */
  async obtenerAvisosUrgentesPendientes(usuarioId: number): Promise<Aviso[]> {
    const user = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: { facultades: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    const facultadIds = (user.facultades || []).map((f) => f.id);

    const query = this.avisoRepository
      .createQueryBuilder('aviso')
      .leftJoinAndSelect('aviso.facultad', 'facultad')
      .leftJoinAndSelect('aviso.autor', 'autor')
      .where('aviso.urgencia IN (:...urgencias)', {
        urgencias: [NivelUrgencia.ALTA, NivelUrgencia.URGENTE],
      });

    if (facultadIds.length > 0) {
      query.andWhere(
        '(aviso.facultadId IN (:...facultadIds) OR aviso.facultadId IS NULL)',
        { facultadIds },
      );
    }

    const avisosUrgentes = await query.getMany();
    if (avisosUrgentes.length === 0) {
      return [];
    }

    const lecturas = await this.lecturaAvisoRepository.find({
      where: {
        usuarioId,
        avisoId: In(avisosUrgentes.map((a) => a.id)),
      },
    });

    const leidosSet = new Set(lecturas.map((l) => l.avisoId));
    return avisosUrgentes.filter((aviso) => !leidosSet.has(aviso.id));
  }
}
