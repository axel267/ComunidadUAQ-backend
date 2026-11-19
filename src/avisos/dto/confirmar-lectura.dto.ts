import { IsInt, IsOptional } from 'class-validator';

export class ConfirmarLecturaDto {
  @IsInt()
  @IsOptional()
  usuarioId?: number;
}

