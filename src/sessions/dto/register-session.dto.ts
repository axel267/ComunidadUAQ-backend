import { IsEmail, IsInt, IsString, IsOptional, Matches } from 'class-validator';

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
}
