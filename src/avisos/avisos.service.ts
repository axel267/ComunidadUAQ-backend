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
   * Valida si un usuario existe y tiene rol de Administrador.
   */
  private async validarEsAdmin(usuarioId?: number): Promise<User> {
    if (!usuarioId) {
      throw new BadRequestException(
        'Se requiere el ID del usuario (usuarioId) para verificar permisos de administrador.',
      );
    }

    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    const esAdmin =
      usuario.rolId === 1 ||
      usuario.rol?.nombre?.toLowerCase().includes('admin') ||
      usuario.rol?.permisos?.all === true;

    if (!esAdmin) {
      throw new ForbiddenException(
        'Acceso denegado. Solo los administradores pueden realizar esta acción sobre los avisos.',
      );
    }

    return usuario;
  }

  async create(createAvisoDto: CreateAvisoDto, usuarioId?: number): Promise<Aviso> {
    const idAValidar = usuarioId ?? createAvisoDto.autorId;
    if (idAValidar) {
      await this.validarEsAdmin(idAValidar);
    }

    const { usuarioId: _uid, ...datosAviso } = createAvisoDto;
    const aviso = this.avisoRepository.create({
      ...datosAviso,
      autorId: idAValidar ?? datosAviso.autorId,
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
  ): Promise<Aviso> {
    await this.validarEsAdmin(usuarioId);

    const aviso = await this.findOne(id);
    const { usuarioId: _uid, ...datosActualizar } = updateAvisoDto;
    Object.assign(aviso, datosActualizar);
    return await this.avisoRepository.save(aviso);
  }

  async remove(id: number, usuarioId?: number): Promise<{ message: string }> {
    await this.validarEsAdmin(usuarioId);

    const aviso = await this.findOne(id);
    await this.avisoRepository.remove(aviso);
    return { message: `Aviso con ID ${id} eliminado correctamente` };
  }

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
  ): Promise<{ totalLecturas: number; lecturas: LecturaAviso[] }> {
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

