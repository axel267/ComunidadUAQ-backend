import { PartialType } from '@nestjs/mapped-types';
import { CreateComunicadoOficialDto } from './create-comunicado-oficial.dto';

export class UpdateComunicadoOficialDto extends PartialType(CreateComunicadoOficialDto) {}
