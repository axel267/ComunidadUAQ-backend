import { IsOptional, IsString, IsEnum } from 'class-validator';
import { NivelUrgencia } from '../entities/aviso.entity';

export class UpdateAvisoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsEnum(NivelUrgencia, { message: 'La urgencia debe ser BAJA, MEDIA o ALTA.' })
  urgencia?: NivelUrgencia;

  @IsOptional()
  @IsString()
  imagenesPortadaUrl?: string;
}
