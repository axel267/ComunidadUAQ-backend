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
  ParseBoolPipe,
} from '@nestjs/common';
import { ForosService } from './foros.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';

@Controller('foros')
export class ForosController {
  constructor(private readonly forosService: ForosService) {}

  // ==========================================
  // ENDPOINTS DE PUBLICACIONES (foro_publicaciones)
  // ==========================================

  @Post()
  create(@Body() createPublicacionDto: CreatePublicacionDto) {
    return this.forosService.create(createPublicacionDto);
  }

  @Get()
  findAll(
    @Query('categoria') categoria?: string,
    @Query('autorId') autorId?: string,
    @Query('esFijado') esFijado?: string,
    @Query('estaCerrado') estaCerrado?: string,
  ) {
    return this.forosService.findAll({
      categoria,
      autorId: autorId ? +autorId : undefined,
      esFijado: esFijado !== undefined ? esFijado === 'true' : undefined,
      estaCerrado: estaCerrado !== undefined ? estaCerrado === 'true' : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.forosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePublicacionDto: UpdatePublicacionDto,
  ) {
    return this.forosService.update(id, updatePublicacionDto);
  }

  @Patch(':id/votar')
  votar(
    @Param('id', ParseIntPipe) id: number,
    @Body('delta') delta?: number,
  ) {
    const cambio = delta !== undefined ? delta : 1;
    return this.forosService.votarPublicacion(id, cambio);
  }

  @Patch(':id/fijar')
  toggleFijado(@Param('id', ParseIntPipe) id: number) {
    return this.forosService.toggleFijado(id);
  }

  @Patch(':id/cerrar')
  toggleCerrado(@Param('id', ParseIntPipe) id: number) {
    return this.forosService.toggleCerrado(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.forosService.remove(id);
  }

  // ==========================================
  // ENDPOINTS DE COMENTARIOS (foro_comentarios)
  // ==========================================

  @Post('comentarios')
  createComentario(@Body() createComentarioDto: CreateComentarioDto) {
    return this.forosService.createComentario(createComentarioDto);
  }

  @Get(':id/comentarios')
  findComentariosByPublicacion(@Param('id', ParseIntPipe) publicacionId: number) {
    return this.forosService.findComentariosByPublicacion(publicacionId);
  }

  @Patch('comentarios/:id')
  updateComentario(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComentarioDto: UpdateComentarioDto,
  ) {
    return this.forosService.updateComentario(id, updateComentarioDto);
  }

  @Patch('comentarios/:id/votar')
  votarComentario(
    @Param('id', ParseIntPipe) id: number,
    @Body('delta') delta?: number,
  ) {
    const cambio = delta !== undefined ? delta : 1;
    return this.forosService.votarComentario(id, cambio);
  }

  @Delete('comentarios/:id')
  removeComentario(@Param('id', ParseIntPipe) id: number) {
    return this.forosService.removeComentario(id);
  }
}
