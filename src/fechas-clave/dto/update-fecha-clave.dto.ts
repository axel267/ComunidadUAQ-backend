import { PartialType } from '@nestjs/mapped-types';
import { CreateFechaClaveDto } from './create-fecha-clave.dto';

export class UpdateFechaClaveDto extends PartialType(CreateFechaClaveDto) {}
