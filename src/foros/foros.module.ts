import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForosService } from './foros.service';
import { ForosController } from './foros.controller';
import { ForoPublicacion } from './entities/foro-publicacion.entity';
import { ForoComentario } from './entities/foro-comentario.entity';
import { User } from '../sessions/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForoPublicacion, ForoComentario, User])],
  controllers: [ForosController],
  providers: [ForosService],
  exports: [ForosService],
})
export class ForosModule {}
