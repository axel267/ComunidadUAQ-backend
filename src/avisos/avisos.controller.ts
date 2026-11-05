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
import { AvisosService } from './avisos.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { ConfirmarLecturaDto } from './dto/confirmar-lectura.dto';
import { NivelUrgencia, EstadoModeracion } from './entities/aviso.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '../auth/constants/roles.enum';
import { User } from '../sessions/user.entity';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  /**
   * POST /avisos
   * Crear aviso: permitido para Administrador, Coordinación y Docentes (en sus áreas/facultades asignadas).
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  create(
    @Body() createAvisoDto: CreateAvisoDto,
    @CurrentUser() user?: User,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      user?.id ??
      createAvisoDto.usuarioId ??
      createAvisoDto.autorId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.avisosService.create(createAvisoDto, usuarioId, user);
  }

  /**
   * GET /avisos
   * Listar avisos con filtros opcionales (público / cualquier usuario).
   */
  @Public()
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

  /**
   * GET /avisos/:id
   * Detalle de un aviso específico (público).
   */
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.avisosService.findOne(id);
  }

  /**
   * PATCH /avisos/:id
   * Modificar aviso: permitido para Administrador o Docente/Coordinador de la facultad asignada.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAvisoDto: UpdateAvisoDto,
    @CurrentUser() user?: User,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      user?.id ??
      updateAvisoDto.usuarioId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.avisosService.update(id, updateAvisoDto, usuarioId, user);
  }

  /**
   * DELETE /avisos/:id
   * Eliminar aviso: Administrador o Docente/Coordinador de su área/facultad.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
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

    return this.avisosService.remove(id, usuarioId, user);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR)
  obtenerLecturas(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
    @Query('usuarioId') queryUsuarioId?: string,
  ) {
    const usuarioId = user?.id ?? (queryUsuarioId ? +queryUsuarioId : undefined);
    return this.avisosService.obtenerLecturas(id, usuarioId, user);
  }
}
