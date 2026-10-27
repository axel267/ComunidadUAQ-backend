import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { NivelUrgencia, EstadoModeracion } from './entities/aviso.entity';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  @Post()
  create(@Body() createAvisoDto: CreateAvisoDto) {
    return this.avisosService.create(createAvisoDto);
  }

  @Get()
  findAll(
    @Query('facultadId') facultadId?: string,
    @Query('autorId') autorId?: string,
    @Query('urgencia') urgencia?: NivelUrgencia,
    @Query('estadoPublicacion') estadoPublicacion?: EstadoModeracion,
  ) {
    return this.avisosService.findAll({
      facultadId: facultadId ? +facultadId : undefined,
      autorId: autorId ? +autorId : undefined,
      urgencia,
      estadoPublicacion,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.avisosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAvisoDto: UpdateAvisoDto,
  ) {
    return this.avisosService.update(id, updateAvisoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.avisosService.remove(id);
  }
}
