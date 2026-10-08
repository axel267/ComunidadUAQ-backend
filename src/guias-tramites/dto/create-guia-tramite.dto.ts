import { IsNotEmpty, IsString, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePasoGuiaDto {
  @IsOptional()
  @IsInt()
  ordenPaso?: number;

  @IsOptional()
  @IsString()
  imagenesUrl?: string;

  @IsOptional()
  @IsString()
  tituloPaso?: string;

  @IsOptional()
  @IsString()
  descripcionDetallada?: string;

  @IsOptional()
  @IsString()
  imagenIlustrativaUrl?: string;
}

export class CreateGuiaTramiteDto {
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty({ message: 'El autor_id es obligatorio.' })
  @IsInt()
  autorId: number;

  @IsNotEmpty({ message: 'El facultad_id es obligatorio.' })
  @IsInt()
  facultadId: number;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePasoGuiaDto)
  pasos?: CreatePasoGuiaDto[];
}
