import { IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CambiarContrasenaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @IsNotEmpty({ message: 'La contraseña actual es obligatoria.' })
  @IsString()
  contrasenaActual: string;

  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  nuevaContrasena: string;

  @IsNotEmpty({ message: 'Debes confirmar la nueva contraseña.' })
  @IsString()
  confirmarContrasena: string;
}
