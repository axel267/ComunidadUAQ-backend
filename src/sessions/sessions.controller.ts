import { Controller, Post, Body } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RegisterSessionDto } from './dto/register-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() body: CreateSessionDto) {
    return this.sessionsService.createSession(body.expediente, body.email, body.pass);
  }

  @Post('register')
  register(@Body() body: RegisterSessionDto) {
    return this.sessionsService.createAccount(
      body.expediente, 
      body.email, 
      body.pass, 
      body.nombre, 
      body.facultadesIds, 
      body.rolId
    );
  }
}
