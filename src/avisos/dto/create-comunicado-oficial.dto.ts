import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { NivelUrgencia } from '../entities/aviso.entity';

export class CreateComunicadoOficialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  resumen?: string | null;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsEnum(NivelUrgencia)
  urgencia: NivelUrgencia;

  @IsDateString()
  @IsOptional()
  fechaLimite?: string | null;

  @IsString()
  @IsOptional()
  @Matches(/^\/uploads\/comunicados\/[\w.-]+\.pdf$/, {
    message: 'adjuntoUrl debe provenir de la carga de adjuntos de comunicados.',
  })
  adjuntoUrl?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  adjuntoNombre?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  adjuntoTamano?: number | null;
}
