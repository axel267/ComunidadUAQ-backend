import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { NivelUrgencia, EstadoModeracion } from '../entities/aviso.entity';

export class CreateAvisoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  contenido?: string;

  @IsEnum(NivelUrgencia)
  @IsNotEmpty()
  urgencia: NivelUrgencia;

  @IsString()
  @IsOptional()
  imagenesPortadaUrl?: string;

  @IsInt()
  @IsOptional()
  facultadId?: number;

  @IsInt()
  @IsOptional()
  autorId?: number;

  @IsEnum(EstadoModeracion)
  @IsOptional()
  estadoPublicacion?: EstadoModeracion;

  @IsString()
  @IsOptional()
  observacionesIa?: string;
}
