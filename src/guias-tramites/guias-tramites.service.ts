import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuiaTramite } from './entities/guia-tramite.entity';
import { CreateGuiaTramiteDto } from './dto/create-guia-tramite.dto';
import { UpdateGuiaTramiteDto } from './dto/update-guia-tramite.dto';

@Injectable()
export class GuiasTramitesService {
  constructor(
    @InjectRepository(GuiaTramite)
    private readonly guiaRepository: Repository<GuiaTramite>,
  ) {}

  async create(createGuiaTramiteDto: CreateGuiaTramiteDto): Promise<GuiaTramite> {
    try {
      // cascade: true en la entidad permite que al crear la guía
      // se guarden automáticamente los pasos asociados en una sola operación
      const guia = this.guiaRepository.create(createGuiaTramiteDto);
      return await this.guiaRepository.save(guia);
    } catch (error: any) {
      if (error.code === '23503' || (error.message && error.message.includes('violates foreign key constraint'))) {
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

  async update(id: number, updateGuiaTramiteDto: UpdateGuiaTramiteDto): Promise<GuiaTramite> {
    const guia = await this.findOne(id);
    const updated = this.guiaRepository.merge(guia, updateGuiaTramiteDto);
    return await this.guiaRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const guia = await this.findOne(id);
    // Los pasos se eliminan automáticamente gracias al ON DELETE CASCADE del SQL
    await this.guiaRepository.remove(guia);
  }
}
