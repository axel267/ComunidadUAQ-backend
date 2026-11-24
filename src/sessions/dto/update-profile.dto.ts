import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsInt()
  userId: number;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  carrera?: string;

  @IsString()
  @IsOptional()
  semestre?: string;

  @IsString()
  @IsOptional()
  campus?: string;

  @IsString()
  @IsOptional()
  biografia?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsArray()
  @IsOptional()
  intereses?: string[];
}
