import { IsEmail, IsNotEmpty } from 'class-validator';

export class RecuperarContrasenaDto {
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @IsEmail({}, { message: 'El correo debe ser un email válido.' })
  correo: string;
}
