import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  expediente?: number;

  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  identificador?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  pass?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
