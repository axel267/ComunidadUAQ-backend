import { IsEmail, IsInt, IsString, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  expediente: number;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  pass: string;
}
