import { IsNotEmpty, IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateFechaClaveDto {
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty({ message: 'La fecha es obligatoria (YYYY-MM-DD).' })
  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  etiqueta?: string;

  @IsOptional()
  @IsInt()
  facultadId?: number;
}
