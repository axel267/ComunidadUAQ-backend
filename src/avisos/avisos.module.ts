import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvisosService } from './avisos.service';
import { AvisosController } from './avisos.controller';
import { Aviso } from './entities/aviso.entity';
import { LecturaAviso } from './entities/lectura-aviso.entity';
import { User } from '../sessions/user.entity';
import { Role } from '../sessions/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Aviso, LecturaAviso, User, Role])],
  controllers: [AvisosController],
  providers: [AvisosService],
  exports: [AvisosService],
})
export class AvisosModule {}

