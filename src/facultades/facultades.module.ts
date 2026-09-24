import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacultadesService } from './facultades.service';
import { FacultadesController } from './facultades.controller';
import { Facultade } from './entities/facultade.entity';
import { User } from '../sessions/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facultade, User])],
  controllers: [FacultadesController],
  providers: [FacultadesService],
})
export class FacultadesModule {}
