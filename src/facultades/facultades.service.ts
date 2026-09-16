import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFacultadeDto } from './dto/create-facultade.dto';
import { UpdateFacultadeDto } from './dto/update-facultade.dto';
import { Facultade } from './entities/facultade.entity';

@Injectable()
export class FacultadesService {
  constructor(
    @InjectRepository(Facultade)
    private readonly facultadeRepository: Repository<Facultade>,
  ) {}

  async create(createFacultadeDto: CreateFacultadeDto): Promise<Facultade> {
    const facultade = this.facultadeRepository.create(createFacultadeDto);
    return await this.facultadeRepository.save(facultade);
  }

  async findAll(): Promise<Facultade[]> {
    return await this.facultadeRepository.find();
  }

  async findOne(id: number): Promise<Facultade> {
    const facultade = await this.facultadeRepository.findOneBy({ id });
    if (!facultade) {
      throw new NotFoundException(`Facultad con ID ${id} no encontrada`);
    }
    return facultade;
  }

  async update(id: number, updateFacultadeDto: UpdateFacultadeDto): Promise<Facultade> {
    const facultade = await this.findOne(id);
    const updated = this.facultadeRepository.merge(facultade, updateFacultadeDto);
    return await this.facultadeRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const facultade = await this.findOne(id);
    await this.facultadeRepository.remove(facultade);
  }
}
