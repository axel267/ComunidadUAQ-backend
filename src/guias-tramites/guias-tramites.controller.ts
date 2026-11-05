import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { GuiasTramitesService } from './guias-tramites.service';
import { CreateGuiaTramiteDto } from './dto/create-guia-tramite.dto';
import { UpdateGuiaTramiteDto } from './dto/update-guia-tramite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '../auth/constants/roles.enum';
import { User } from '../sessions/user.entity';

@Controller('guias-tramites')
export class GuiasTramitesController {
  constructor(private readonly guiasTramitesService: GuiasTramitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  create(
    @Body() createGuiaTramiteDto: CreateGuiaTramiteDto,
    @CurrentUser() user?: User,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      user?.id ??
      createGuiaTramiteDto.autorId ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.guiasTramitesService.create(createGuiaTramiteDto, usuarioId, user);
  }

  @Public()
  @Get()
  findAll() {
    return this.guiasTramitesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.guiasTramitesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGuiaTramiteDto: UpdateGuiaTramiteDto,
    @CurrentUser() user?: User,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      user?.id ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.guiasTramitesService.update(id, updateGuiaTramiteDto, usuarioId, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
    @Query('usuarioId') queryUsuarioId?: string,
    @Headers('x-user-id') headerUsuarioId?: string,
  ) {
    const usuarioId =
      user?.id ??
      (queryUsuarioId ? +queryUsuarioId : undefined) ??
      (headerUsuarioId ? +headerUsuarioId : undefined);

    return this.guiasTramitesService.remove(id, usuarioId, user);
  }
}
