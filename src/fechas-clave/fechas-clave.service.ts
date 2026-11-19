import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FechaClave } from './entities/fecha-clave.entity';
import { CreateFechaClaveDto } from './dto/create-fecha-clave.dto';
import { UpdateFechaClaveDto } from './dto/update-fecha-clave.dto';

@Injectable()
export class FechasClaveService {
  constructor(
    @InjectRepository(FechaClave)
    private readonly fechaClaveRepository: Repository<FechaClave>,
  ) {}

  async create(createDto: CreateFechaClaveDto): Promise<FechaClave> {
    const entidad = this.fechaClaveRepository.create(createDto);
    return await this.fechaClaveRepository.save(entidad);
  }

  async findAll(): Promise<FechaClave[]> {
    return await this.fechaClaveRepository.find({
      relations: { facultad: true },
      order: { fecha: 'ASC' },
    });
  }

  async findOne(id: number): Promise<FechaClave> {
    const item = await this.fechaClaveRepository.findOne({
      where: { id },
      relations: { facultad: true },
    });
    if (!item) {
      throw new NotFoundException(`Fecha clave con ID ${id} no encontrada.`);
    }
    return item;
  }

  async update(id: number, updateDto: UpdateFechaClaveDto): Promise<FechaClave> {
    const item = await this.findOne(id);
    const updated = this.fechaClaveRepository.merge(item, updateDto);
    return await this.fechaClaveRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const item = await this.findOne(id);
    await this.fechaClaveRepository.remove(item);
    return { message: `Fecha clave con ID ${id} eliminada correctamente` };
  }
}
