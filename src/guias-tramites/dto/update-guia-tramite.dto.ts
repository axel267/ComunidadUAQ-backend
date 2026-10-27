import { IsOptional, IsString } from 'class-validator';

export class UpdateGuiaTramiteDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;
}
