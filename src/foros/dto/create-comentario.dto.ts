import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateComentarioDto {
  @IsInt()
  @IsNotEmpty()
  publicacionId: number;

  @IsInt()
  @IsOptional()
  comentarioPadreId?: number;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsInt()
  @IsOptional()
  autorId?: number;

  @IsString()
  @IsOptional()
  imagenesUrl?: string;
}
