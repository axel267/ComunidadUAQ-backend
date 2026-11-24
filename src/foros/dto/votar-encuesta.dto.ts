import { IsInt, IsOptional, IsObject, Min } from 'class-validator';
import type { EncuestaForoData } from '../entities/foro-publicacion.entity';

export class VotarEncuestaDto {
  @IsInt()
  @Min(0)
  opcionIndex: number;

  @IsInt()
  @IsOptional()
  usuarioId?: number;

  @IsObject()
  @IsOptional()
  encuestaFallback?: EncuestaForoData;
}
