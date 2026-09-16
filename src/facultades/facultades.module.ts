import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacultadesService } from './facultades.service';
import { FacultadesController } from './facultades.controller';
import { Facultade } from './entities/facultade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facultade])],
  controllers: [FacultadesController],
  providers: [FacultadesService],
})
export class FacultadesModule {}
