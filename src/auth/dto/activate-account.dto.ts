import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';

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
  carrera?: string;

  @IsOptional()
  facultadId?: number;
}
