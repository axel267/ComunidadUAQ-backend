import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicacionDto } from './create-publicacion.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdatePublicacionDto extends PartialType(CreatePublicacionDto) {
  @IsInt()
  @IsOptional()
  usuarioId?: number;
}
