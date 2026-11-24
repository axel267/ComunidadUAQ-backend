import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForoPublicacion } from './entities/foro-publicacion.entity';
import { ForoComentario } from './entities/foro-comentario.entity';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { VotarEncuestaDto } from './dto/votar-encuesta.dto';
import { User } from '../sessions/user.entity';
import { RoleId, RoleName } from '../auth/constants/roles.enum';

@Injectable()
export class ForosService {
  constructor(
    @InjectRepository(ForoPublicacion)
    private readonly publicacionRepository: Repository<ForoPublicacion>,
    @InjectRepository(ForoComentario)
    private readonly comentarioRepository: Repository<ForoComentario>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ==========================================
  // PUBLICACIONES (foro_publicaciones)
  // ==========================================

  async create(createPublicacionDto: CreatePublicacionDto): Promise<ForoPublicacion> {
    if (createPublicacionDto.autorId) {
      const user = await this.userRepository.findOneBy({ id: createPublicacionDto.autorId });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${createPublicacionDto.autorId} no encontrado`);
      }
    }

    const encuestaNormalizada = createPublicacionDto.encuesta?.opciones?.length
      ? {
          pregunta: createPublicacionDto.encuesta.pregunta,
          opciones: createPublicacionDto.encuesta.opciones,
          duracion: createPublicacionDto.encuesta.duracion || '3d',
          votosPorOpcion: createPublicacionDto.encuesta.opciones.map(() => 0),
          votosUsuarios: {},
        }
      : null;

    const nuevaPublicacion = this.publicacionRepository.create({
      ...createPublicacionDto,
      categoria: createPublicacionDto.categoria || 'General',
      votos: 0,
      esFijado: createPublicacionDto.esFijado ?? false,
      estaCerrado: createPublicacionDto.estaCerrado ?? false,
      encuesta: encuestaNormalizada,
    });

    return await this.publicacionRepository.save(nuevaPublicacion);
  }

  async findAll(query?: {
    categoria?: string;
    autorId?: number;
    esFijado?: boolean;
    estaCerrado?: boolean;
  }): Promise<ForoPublicacion[]> {
    const where: any = {};

    if (query?.categoria) {
      where.categoria = query.categoria;
    }
    if (query?.autorId) {
      where.autorId = query.autorId;
    }
    if (query?.esFijado !== undefined) {
      where.esFijado = query.esFijado;
    }
    if (query?.estaCerrado !== undefined) {
      where.estaCerrado = query.estaCerrado;
    }

    return await this.publicacionRepository.find({
      where,
      relations: {
        autor: true,
        comentarios: {
          autor: true,
          respuestas: {
            autor: true,
          },
        },
      },
      order: {
        esFijado: 'DESC',
        fechaCreacion: 'DESC',
        comentarios: {
          fechaCreacion: 'ASC',
        },
      },
    });
  }

  async findOne(id: number): Promise<ForoPublicacion> {
    const publicacion = await this.publicacionRepository.findOne({
      where: { id },
      relations: {
        autor: true,
        comentarios: {
          autor: true,
          respuestas: {
            autor: true,
          },
        },
      },
      order: {
        comentarios: {
          fechaCreacion: 'ASC',
        },
      },
    });

    if (!publicacion) {
      throw new NotFoundException(`Publicación con ID ${id} no encontrada`);
    }

    return publicacion;
  }

  async update(
    id: number,
    updatePublicacionDto: UpdatePublicacionDto,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<ForoPublicacion> {
    const uid = userAutenticado?.id ?? usuarioId;
    if (!uid) {
      throw new BadRequestException(
        'Se requiere el ID del usuario (usuarioId) para verificar que sea el dueño de la publicación.',
      );
    }

    const publicacion = await this.findOne(id);

    if (publicacion.autorId !== uid) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta publicación. Solo el dueño de la publicación puede actualizarla.',
      );
    }

    if (updatePublicacionDto.autorId && updatePublicacionDto.autorId !== publicacion.autorId) {
      const user = await this.userRepository.findOneBy({ id: updatePublicacionDto.autorId });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${updatePublicacionDto.autorId} no encontrado`);
      }
    }

    const { usuarioId: _uid, ...datosActualizar } = updatePublicacionDto;
    const updated = this.publicacionRepository.merge(publicacion, datosActualizar);
    return await this.publicacionRepository.save(updated);
  }

  async remove(
    id: number,
    usuarioId?: number,
    userAutenticado?: User,
  ): Promise<{ message: string }> {
    const uid = userAutenticado?.id ?? usuarioId;
    if (!uid) {
      throw new BadRequestException(
        'Se requiere el ID del usuario (usuarioId) para verificar permisos sobre la publicación.',
      );
    }

    const publicacion = await this.findOne(id);
    const esDuenio = publicacion.autorId === uid;

    const user =
      userAutenticado ||
      (await this.userRepository.findOne({
        where: { id: uid },
        relations: { rol: true },
      }));

    const esModeradorOAdmin =
      user?.rolId === RoleId.ADMIN ||
      user?.rolId === RoleId.COORDINADOR ||
      user?.rol?.nombre === RoleName.ADMIN ||
      user?.rol?.nombre === RoleName.COORDINADOR;

    if (!esDuenio && !esModeradorOAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta publicación. Solo el dueño o el personal de moderación/administración puede eliminarla.',
      );
    }

    await this.publicacionRepository.remove(publicacion);
    return { message: `Publicación con ID ${id} eliminada correctamente` };
  }

  async votarPublicacion(id: number, delta: number): Promise<ForoPublicacion> {
    const publicacion = await this.findOne(id);
    publicacion.votos += delta;
    return await this.publicacionRepository.save(publicacion);
  }

  async votarEncuesta(id: number, dto: VotarEncuestaDto): Promise<ForoPublicacion> {
    const publicacion = await this.findOne(id);
    const base = publicacion.encuesta ?? dto.encuestaFallback;
    if (!base || !Array.isArray(base.opciones) || base.opciones.length === 0) {
      throw new BadRequestException('Esta publicacion no contiene una encuesta valida.');
    }
    if (dto.opcionIndex < 0 || dto.opcionIndex >= base.opciones.length) {
      throw new BadRequestException('Opcion de encuesta fuera de rango.');
    }

    const votosUsuarios: Record<string, number> = { ...(base.votosUsuarios ?? {}) };
    const votosPorOpcion = base.opciones.map((_, idx) => base.votosPorOpcion?.[idx] ?? 0);

    if (dto.usuarioId !== undefined && dto.usuarioId !== null) {
      const key = String(dto.usuarioId);
      const prevIdx = votosUsuarios[key];
      if (prevIdx !== undefined && prevIdx >= 0 && prevIdx < votosPorOpcion.length) {
        votosPorOpcion[prevIdx] = Math.max(0, votosPorOpcion[prevIdx] - 1);
      }
      if (prevIdx === dto.opcionIndex) {
        delete votosUsuarios[key];
      } else {
        votosUsuarios[key] = dto.opcionIndex;
        votosPorOpcion[dto.opcionIndex] = (votosPorOpcion[dto.opcionIndex] ?? 0) + 1;
      }
    } else {
      votosPorOpcion[dto.opcionIndex] = (votosPorOpcion[dto.opcionIndex] ?? 0) + 1;
    }

    publicacion.encuesta = {
      pregunta: base.pregunta,
      opciones: base.opciones,
      duracion: base.duracion,
      votosPorOpcion,
      votosUsuarios,
    };

    return await this.publicacionRepository.save(publicacion);
  }

  async toggleFijado(id: number): Promise<ForoPublicacion> {
    const publicacion = await this.findOne(id);
    publicacion.esFijado = !publicacion.esFijado;
    return await this.publicacionRepository.save(publicacion);
  }

  async toggleCerrado(id: number): Promise<ForoPublicacion> {
    const publicacion = await this.findOne(id);
    publicacion.estaCerrado = !publicacion.estaCerrado;
    return await this.publicacionRepository.save(publicacion);
  }

  // ==========================================
  // COMENTARIOS (foro_comentarios)
  // ==========================================

  async createComentario(createComentarioDto: CreateComentarioDto): Promise<ForoComentario> {
    const publicacion = await this.publicacionRepository.findOneBy({ id: createComentarioDto.publicacionId });
    if (!publicacion) {
      throw new NotFoundException(`Publicación con ID ${createComentarioDto.publicacionId} no encontrada`);
    }

    if (publicacion.estaCerrado) {
      throw new BadRequestException(`La publicación con ID ${createComentarioDto.publicacionId} está cerrada a nuevos comentarios.`);
    }

    if (createComentarioDto.comentarioPadreId) {
      const padre = await this.comentarioRepository.findOneBy({ id: createComentarioDto.comentarioPadreId });
      if (!padre) {
        throw new NotFoundException(`Comentario padre con ID ${createComentarioDto.comentarioPadreId} no encontrado`);
      }
    }

    if (createComentarioDto.autorId) {
      const user = await this.userRepository.findOneBy({ id: createComentarioDto.autorId });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${createComentarioDto.autorId} no encontrado`);
      }
    }

    const nuevoComentario = this.comentarioRepository.create({
      ...createComentarioDto,
      votos: 0,
    });

    const guardado = await this.comentarioRepository.save(nuevoComentario);
    const encontrado = await this.comentarioRepository.findOne({
      where: { id: guardado.id },
      relations: {
        autor: true,
        respuestas: {
          autor: true,
        },
      },
    });
    return encontrado ?? guardado;
  }

  async findComentariosByPublicacion(publicacionId: number): Promise<ForoComentario[]> {
    return await this.comentarioRepository.find({
      where: { publicacionId },
      relations: {
        autor: true,
        respuestas: {
          autor: true,
        },
      },
      order: { fechaCreacion: 'ASC' },
    });
  }

  async votarComentario(id: number, delta: number): Promise<ForoComentario> {
    const comentario = await this.comentarioRepository.findOneBy({ id });
    if (!comentario) {
      throw new NotFoundException(`Comentario con ID ${id} no encontrado`);
    }
    comentario.votos += delta;
    return await this.comentarioRepository.save(comentario);
  }

  async removeComentario(id: number): Promise<void> {
    const comentario = await this.comentarioRepository.findOneBy({ id });
    if (!comentario) {
      throw new NotFoundException(`Comentario con ID ${id} no encontrado`);
    }
    await this.comentarioRepository.remove(comentario);
  }
}
