import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuiasTramitesService } from './guias-tramites.service';
import { GuiasTramitesController } from './guias-tramites.controller';
import { GuiaTramite } from './entities/guia-tramite.entity';
import { PasoGuia } from './entities/paso-guia.entity';
import { User } from '../sessions/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GuiaTramite, PasoGuia, User])],
  controllers: [GuiasTramitesController],
  providers: [GuiasTramitesService],
  exports: [GuiasTramitesService],
})
export class GuiasTramitesModule {}
