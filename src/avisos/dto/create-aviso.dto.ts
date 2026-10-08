import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { NivelUrgencia } from '../entities/aviso.entity';

export class CreateAvisoDto {
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsNotEmpty({ message: 'La urgencia es obligatoria.' })
  @IsEnum(NivelUrgencia, { message: 'La urgencia debe ser BAJA, MEDIA o ALTA.' })
  urgencia: NivelUrgencia;

  @IsOptional()
  @IsString()
  imagenesPortadaUrl?: string;

  @IsNotEmpty({ message: 'El facultad_id es obligatorio.' })
  @IsInt()
  facultadId: number;

  @IsNotEmpty({ message: 'El autor_id es obligatorio.' })
  @IsInt()
  autorId: number;
}
