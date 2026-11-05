import { PartialType } from '@nestjs/mapped-types';
import { CreateGuiaTramiteDto } from './create-guia-tramite.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateGuiaTramiteDto extends PartialType(CreateGuiaTramiteDto) {
  @IsInt()
  @IsOptional()
  usuarioId?: number;
}
