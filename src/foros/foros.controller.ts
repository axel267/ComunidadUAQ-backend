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
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ForosService } from './foros.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../sessions/user.entity';

@Controller('foros')
export class ForosController {
  constructor(private readonly forosService: ForosService) {}

  // ==========================================
  // ENDPOINTS DE PUBLICACIONES (foro_publicaciones)
  // ==========================================

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPublicacionDto: CreatePublicacionDto,
    @CurrentUser() user?: User,
  ) {
    if (user && !createPublicacionDto.autorId) {
      createPublicacionDto.autorId = user.id;
    }
    return this.forosService.create(createPublicacionDto);
  }

  @Public()
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

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.forosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePublicacionDto: UpdatePublicacionDto,
    @CurrentUser() user?: User,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      user?.id ??
      updatePublicacionDto.usuarioId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.forosService.update(id, updatePublicacionDto, usuarioId, user);
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
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
    @Body('usuarioId') bodyUsuarioId?: number,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      user?.id ??
      bodyUsuarioId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.forosService.remove(id, usuarioId, user);
  }

  // ==========================================
  // ENDPOINTS DE COMENTARIOS (foro_comentarios)
  // ==========================================

  @Post('comentarios')
  @UseGuards(JwtAuthGuard)
  createComentario(
    @Body() createComentarioDto: CreateComentarioDto,
    @CurrentUser() user?: User,
  ) {
    if (user && !createComentarioDto.autorId) {
      createComentarioDto.autorId = user.id;
    }
    return this.forosService.createComentario(createComentarioDto);
  }

  @Public()
  @Get(':id/comentarios')
  findComentariosByPublicacion(@Param('id', ParseIntPipe) publicacionId: number) {
    return this.forosService.findComentariosByPublicacion(publicacionId);
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
  @UseGuards(JwtAuthGuard)
  removeComentario(@Param('id', ParseIntPipe) id: number) {
    return this.forosService.removeComentario(id);
  }
}
