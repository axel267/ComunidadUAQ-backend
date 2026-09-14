import { Controller, Post, Body } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() body: { expediente: number; email: string; pass: string }) {
    return this.sessionsService.createSession(body.expediente, body.email, body.pass);
  }
}
