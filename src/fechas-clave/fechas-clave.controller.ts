import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FechasClaveService } from './fechas-clave.service';
import { CreateFechaClaveDto } from './dto/create-fecha-clave.dto';
import { UpdateFechaClaveDto } from './dto/update-fecha-clave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RoleName } from '../auth/constants/roles.enum';

@Controller('fechas-clave')
export class FechasClaveController {
  constructor(private readonly fechasClaveService: FechasClaveService) {}

  @Public()
  @Get()
  findAll() {
    return this.fechasClaveService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fechasClaveService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  create(@Body() createDto: CreateFechaClaveDto) {
    return this.fechasClaveService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFechaClaveDto,
  ) {
    return this.fechasClaveService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.COORDINADOR, RoleName.DOCENTE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fechasClaveService.remove(id);
  }
}
