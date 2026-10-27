import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GuiasTramitesService } from './guias-tramites.service';
import { CreateGuiaTramiteDto } from './dto/create-guia-tramite.dto';
import { UpdateGuiaTramiteDto } from './dto/update-guia-tramite.dto';

@Controller('guias-tramites')
export class GuiasTramitesController {
  constructor(private readonly guiasTramitesService: GuiasTramitesService) {}

  @Post()
  create(@Body() createGuiaTramiteDto: CreateGuiaTramiteDto) {
    return this.guiasTramitesService.create(createGuiaTramiteDto);
  }

  @Get()
  findAll() {
    return this.guiasTramitesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guiasTramitesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGuiaTramiteDto: UpdateGuiaTramiteDto) {
    return this.guiasTramitesService.update(+id, updateGuiaTramiteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guiasTramitesService.remove(+id);
  }
}
