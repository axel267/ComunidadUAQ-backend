import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FechasClaveService } from './fechas-clave.service';
import { FechasClaveController } from './fechas-clave.controller';
import { FechaClave } from './entities/fecha-clave.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FechaClave])],
  controllers: [FechasClaveController],
  providers: [FechasClaveService],
  exports: [FechasClaveService],
})
export class FechasClaveModule {}
