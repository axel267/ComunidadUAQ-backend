import { IsInt, IsNotEmpty } from 'class-validator';

export class ConfirmarLecturaDto {
  @IsInt()
  @IsNotEmpty()
  usuarioId: number;
}
