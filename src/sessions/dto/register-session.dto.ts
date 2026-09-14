import { IsEmail, IsInt, IsString, MinLength } from 'class-validator';

export class RegisterSessionDto {
  @IsInt()
  expediente: number;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  pass: string;

  @IsString()
  nombre: string;

  @IsInt()
  facultadId: number;

  @IsInt()
  rolId: number;
}
