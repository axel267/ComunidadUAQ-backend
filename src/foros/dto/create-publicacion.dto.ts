import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';

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
}
