import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForoPublicacion } from './entities/foro-publicacion.entity';
import { ForoComentario } from './entities/foro-comentario.entity';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { User } from '../sessions/user.entity';

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

    const nuevaPublicacion = this.publicacionRepository.create({
      ...createPublicacionDto,
      categoria: createPublicacionDto.categoria || 'General',
      votos: 0,
      esFijado: createPublicacionDto.esFijado ?? false,
      estaCerrado: createPublicacionDto.estaCerrado ?? false,
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
      relations: { autor: true },
      order: {
        esFijado: 'DESC',
        fechaCreacion: 'DESC',
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

  async update(id: number, updatePublicacionDto: UpdatePublicacionDto): Promise<ForoPublicacion> {
    const publicacion = await this.findOne(id);

    if (updatePublicacionDto.autorId && updatePublicacionDto.autorId !== publicacion.autorId) {
      const user = await this.userRepository.findOneBy({ id: updatePublicacionDto.autorId });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${updatePublicacionDto.autorId} no encontrado`);
      }
    }

    const updated = this.publicacionRepository.merge(publicacion, updatePublicacionDto);
    return await this.publicacionRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const publicacion = await this.findOne(id);
    await this.publicacionRepository.remove(publicacion);
  }

  async votarPublicacion(id: number, delta: number): Promise<ForoPublicacion> {
    const publicacion = await this.findOne(id);
    publicacion.votos += delta;
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

    return await this.comentarioRepository.save(nuevoComentario);
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
