import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { ConfirmarLecturaDto } from './dto/confirmar-lectura.dto';
import { NivelUrgencia, EstadoModeracion } from './entities/aviso.entity';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  @Post()
  create(
    @Body() createAvisoDto: CreateAvisoDto,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      createAvisoDto.usuarioId ??
      createAvisoDto.autorId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.avisosService.create(createAvisoDto, usuarioId);
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
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      updateAvisoDto.usuarioId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.avisosService.update(id, updateAvisoDto, usuarioId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Body('usuarioId') bodyUsuarioId?: number,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      bodyUsuarioId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.avisosService.remove(id, usuarioId);
  }

  // ==========================================
  // CONFIRMACIÓN Y ESTADO DE LECTURA DE AVISOS
  // ==========================================

  @Post(':id/leer')
  marcarComoLeido(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmarLecturaDto,
  ) {
    return this.avisosService.marcarComoLeido(id, dto.usuarioId);
  }

  @Get(':id/leido')
  verificarLectura(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.avisosService.verificarLectura(id, usuarioId);
  }

  @Get(':id/lecturas')
  obtenerLecturas(@Param('id', ParseIntPipe) id: number) {
    return this.avisosService.obtenerLecturas(id);
  }
}
