import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class RegisterSessionDto {
  @IsInt()
  expediente: number;

  @IsEmail()
  @Matches(/^[a-zA-Z0-9._%+-]+@(uaq\.mx|alumnos\.uaq\.mx)$/i, {
    message: 'El correo debe pertenecer al dominio institucional (@uaq.mx o @alumnos.uaq.mx)',
  })
  email: string;

  @IsString()
  nombre: string;

  @IsInt({ each: true })
  facultadesIds: number[];

  @IsInt()
  rolId: number;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  carrera?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  semestre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  campus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  biografia?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  intereses?: string[];
}
