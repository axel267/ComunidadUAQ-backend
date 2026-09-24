import { Controller, Post, Body, Get, Query } from '@nestjs/common';
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

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.sessionsService.forgotPassword(email);
  }

  @Get('verify-reset-token')
  verifyResetToken(@Query('token') token: string) {
    return this.sessionsService.verifyResetToken(token);
  }

  @Post('reset-password')
  resetPassword(@Body('token') token: string, @Body('newPass') newPass: string) {
    return this.sessionsService.resetPassword(token, newPass);
  }
}
