import { IsEmail, IsInt, IsString } from 'class-validator';

export class RegisterSessionDto {
  @IsInt()
  expediente: number;

  @IsEmail()
  email: string;

  @IsString()
  nombre: string;

  @IsInt({ each: true })
  facultadesIds: number[];

  @IsInt()
  rolId: number;
}
