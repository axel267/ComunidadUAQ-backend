import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class RegistrarAsistenciaDto {
  @IsString()
  @IsNotEmpty()
  codigoQrOExpediente: string;

  @IsString()
  @IsOptional()
  eventoTitulo?: string;

  @IsInt()
  @IsOptional()
  tomadoPorId?: number;
}
