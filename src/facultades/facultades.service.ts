import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFacultadeDto } from './dto/create-facultade.dto';
import { UpdateFacultadeDto } from './dto/update-facultade.dto';
import { Facultade } from './entities/facultade.entity';
import { User } from '../sessions/user.entity';

@Injectable()
export class FacultadesService {
  constructor(
    @InjectRepository(Facultade)
    private readonly facultadeRepository: Repository<Facultade>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createFacultadeDto: CreateFacultadeDto): Promise<Facultade> {
    const { nombre, abreviatura } = createFacultadeDto;

    // Verificar si ya existe una facultad con el mismo nombre
    const existingByNombre = await this.facultadeRepository.findOne({
      where: { nombre },
    });
    if (existingByNombre) {
      throw new ConflictException(
        `Ya existe una facultad con el nombre "${nombre}"`,
      );
    }

    // Verificar si ya existe una facultad con la misma abreviatura (solo si se proporcionó)
    if (abreviatura) {
      const existingByAbreviatura = await this.facultadeRepository.findOne({
        where: { abreviatura },
      });
      if (existingByAbreviatura) {
        throw new ConflictException(
          `Ya existe una facultad con la abreviatura "${abreviatura}"`,
        );
      }
    }

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
    const facultade = await this.findOne(id); // lanza 404 si no existe

    const { nombre, abreviatura } = updateFacultadeDto;

    // Verificar nombre duplicado (excluyendo la facultad actual)
    if (nombre && nombre !== facultade.nombre) {
      const existingByNombre = await this.facultadeRepository.findOne({
        where: { nombre },
      });
      if (existingByNombre) {
        throw new ConflictException(
          `Ya existe una facultad con el nombre "${nombre}"`,
        );
      }
    }

    // Verificar abreviatura duplicada (excluyendo la facultad actual)
    if (abreviatura && abreviatura !== facultade.abreviatura) {
      const existingByAbreviatura = await this.facultadeRepository.findOne({
        where: { abreviatura },
      });
      if (existingByAbreviatura) {
        throw new ConflictException(
          `Ya existe una facultad con la abreviatura "${abreviatura}"`,
        );
      }
    }

    const updated = this.facultadeRepository.merge(facultade, updateFacultadeDto);
    return await this.facultadeRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const facultade = await this.findOne(id); // lanza 404 si no existe

    // Contar usuarios que tienen esta facultad usando la tabla join
    const userCount = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.facultades', 'facultad', 'facultad.id = :id', { id })
      .getCount();

    if (userCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la facultad "${facultade.nombre}" porque tiene ${userCount} usuario(s) asociado(s)`,
      );
    }

    await this.facultadeRepository.remove(facultade);
  }
}
