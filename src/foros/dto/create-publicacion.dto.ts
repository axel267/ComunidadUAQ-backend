import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsObject } from 'class-validator';
import type { EncuestaForoData, EventoForoData } from '../entities/foro-publicacion.entity';

export class CreatePublicacionDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsString()
  @IsOptional()
  imagenesUrl?: string;

  @IsInt()
  @IsOptional()
  autorId?: number;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsBoolean()
  @IsOptional()
  esFijado?: boolean;

  @IsBoolean()
  @IsOptional()
  estaCerrado?: boolean;

  @IsObject()
  @IsOptional()
  encuesta?: EncuestaForoData;

  @IsObject()
  @IsOptional()
  evento?: EventoForoData;
}
