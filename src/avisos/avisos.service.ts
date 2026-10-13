import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aviso, NivelUrgencia, EstadoModeracion } from './entities/aviso.entity';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';

@Injectable()
export class AvisosService {
  constructor(
    @InjectRepository(Aviso)
    private readonly avisoRepository: Repository<Aviso>,
  ) {}

  async create(createAvisoDto: CreateAvisoDto): Promise<Aviso> {
    const aviso = this.avisoRepository.create(createAvisoDto);
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

  async update(id: number, updateAvisoDto: UpdateAvisoDto): Promise<Aviso> {
    const aviso = await this.findOne(id);
    Object.assign(aviso, updateAvisoDto);
    return await this.avisoRepository.save(aviso);
  }

  async remove(id: number): Promise<{ message: string }> {
    const aviso = await this.findOne(id);
    await this.avisoRepository.remove(aviso);
    return { message: `Aviso con ID ${id} eliminado correctamente` };
  }
}
