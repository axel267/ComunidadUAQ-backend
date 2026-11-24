import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class ActivateAccountDto {
  @IsNotEmpty({ message: 'El expediente es obligatorio' })
  expediente: string | number;

  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @Matches(/^[a-zA-Z0-9._%+-]+@(uaq\.mx|alumnos\.uaq\.mx)$/i, {
    message: 'El correo debe pertenecer al dominio institucional (@uaq.mx o @alumnos.uaq.mx)',
  })
  email: string;

  @IsOptional()
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  carrera?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  facultadId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  semestre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  campus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  biografia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  intereses?: string[];
}
