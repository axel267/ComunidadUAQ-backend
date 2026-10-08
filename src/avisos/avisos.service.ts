import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aviso, EstadoPublicacion } from './entities/aviso.entity';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';

@Injectable()
export class AvisosService {
  constructor(
    @InjectRepository(Aviso)
    private readonly avisoRepository: Repository<Aviso>,
  ) {}

  async create(createAvisoDto: CreateAvisoDto): Promise<Aviso> {
    try {
      // Regla de negocio: el estado siempre se guarda como PENDIENTE al crear
      const aviso = this.avisoRepository.create({
        ...createAvisoDto,
        estadoPublicacion: EstadoPublicacion.PENDIENTE,
      });

      return await this.avisoRepository.save(aviso);
    } catch (error: any) {
      // Manejar error de llave foránea (facultad o autor que no existe)
      if (error.code === '23503' || (error.message && error.message.includes('violates foreign key constraint'))) {
        throw new BadRequestException('La facultad o el autor especificado no existen en el sistema.');
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Fallo al crear el aviso: ${errorMessage}`);
    }
  }

  async findAll(): Promise<Aviso[]> {
    return await this.avisoRepository.find({
      relations: { facultad: true, autor: true },
    });
  }

  async findOne(id: number): Promise<Aviso> {
    const aviso = await this.avisoRepository.findOne({
      where: { id },
      relations: { facultad: true, autor: true },
    });
    if (!aviso) {
      throw new NotFoundException(`Aviso con ID ${id} no encontrado.`);
    }
    return aviso;
  }

  async update(id: number, updateAvisoDto: UpdateAvisoDto): Promise<Aviso> {
    const aviso = await this.findOne(id); // lanza 404 si no existe
    const updated = this.avisoRepository.merge(aviso, updateAvisoDto);
    return await this.avisoRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const aviso = await this.findOne(id); // lanza 404 si no existe
    await this.avisoRepository.remove(aviso);
  }
}
