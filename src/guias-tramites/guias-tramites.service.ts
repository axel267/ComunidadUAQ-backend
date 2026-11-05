import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuiaTramite } from './entities/guia-tramite.entity';
import { CreateGuiaTramiteDto } from './dto/create-guia-tramite.dto';
import { UpdateGuiaTramiteDto } from './dto/update-guia-tramite.dto';
import { User } from '../sessions/user.entity';
import { validarPermisoFacultadOArea } from '../auth/utils/area-permissions';

@Injectable()
export class GuiasTramitesService {
  constructor(
    @InjectRepository(GuiaTramite)
    private readonly guiaRepository: Repository<GuiaTramite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async obtenerYValidarUsuario(usuarioId?: number): Promise<User> {
    if (!usuarioId) {
      throw new BadRequestException(
        'Se requiere la identificación del usuario para verificar permisos.',
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
      throw new ForbiddenException('La cuenta de usuario está desactivada.');
    }

    return usuario;
  }

  async create(
    createGuiaTramiteDto: CreateGuiaTramiteDto,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<GuiaTramite> {
    const user =
      userAutenticado ||
      (await this.obtenerYValidarUsuario(usuarioId ?? createGuiaTramiteDto.autorId));

    // Validar RBAC por área/facultad:
    // Administrador: Global
    // Docente / Coordinador: En sus facultades asignadas
    // Estudiante: No puede gestionar guías
    validarPermisoFacultadOArea(user, createGuiaTramiteDto.facultadId);

    try {
      const guia = this.guiaRepository.create({
        ...createGuiaTramiteDto,
        autorId: user.id,
      });
      return await this.guiaRepository.save(guia);
    } catch (error: any) {
      if (
        error.code === '23503' ||
        (error.message && error.message.includes('violates foreign key constraint'))
      ) {
        throw new BadRequestException('La facultad o el autor especificado no existen en el sistema.');
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Fallo al crear la guía: ${errorMessage}`);
    }
  }

  async findAll(): Promise<GuiaTramite[]> {
    return await this.guiaRepository.find({
      relations: { pasos: true, facultad: true, autor: true },
      order: { pasos: { ordenPaso: 'ASC' } },
    });
  }

  async findOne(id: number): Promise<GuiaTramite> {
    const guia = await this.guiaRepository.findOne({
      where: { id },
      relations: { pasos: true, facultad: true, autor: true },
      order: { pasos: { ordenPaso: 'ASC' } },
    });
    if (!guia) {
      throw new NotFoundException(`Guía con ID ${id} no encontrada.`);
    }
    return guia;
  }

  async update(
    id: number,
    updateGuiaTramiteDto: UpdateGuiaTramiteDto,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<GuiaTramite> {
    const user =
      userAutenticado || (await this.obtenerYValidarUsuario(usuarioId));
    const guia = await this.findOne(id);

    // Validar permiso en la facultad destino o existente
    validarPermisoFacultadOArea(
      user,
      updateGuiaTramiteDto.facultadId || guia.facultadId,
    );

    const updated = this.guiaRepository.merge(guia, updateGuiaTramiteDto);
    return await this.guiaRepository.save(updated);
  }

  async remove(
    id: number,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<{ message: string }> {
    const user =
      userAutenticado || (await this.obtenerYValidarUsuario(usuarioId));
    const guia = await this.findOne(id);

    validarPermisoFacultadOArea(user, guia.facultadId);

    await this.guiaRepository.remove(guia);
    return { message: `Guía con ID ${id} eliminada correctamente` };
  }
}
