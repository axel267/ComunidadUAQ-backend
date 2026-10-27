import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { User } from './user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'super-secreto-universidad-uaq', // En producción esto debería ir en un archivo .env
      signOptions: { expiresIn: '15m' }, // El token expira en 15 minutos
    }),
    MailModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule { }
