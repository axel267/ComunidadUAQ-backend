import { Controller, Post, Body, Get, Query, Patch } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RegisterSessionDto } from './dto/register-session.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  /** POST /sessions — Iniciar sesión */
  @Post()
  create(@Body() body: CreateSessionDto) {
    return this.sessionsService.createSession(
      body.expediente,
      body.email,
      body.pass,
    );
  }

  /** POST /sessions/register — Crear cuenta (genera y envía contraseña por correo) */
  @Post('register')
  register(@Body() body: RegisterSessionDto) {
    return this.sessionsService.createAccount(
      body.expediente,
      body.email,
      body.nombre,
      body.facultadesIds,
      body.rolId,
    );
  }

  /** PATCH /sessions/change-password — Cambiar contraseña */
  @Patch('change-password')
  changePassword(@Body() body: ChangePasswordDto) {
    return this.sessionsService.changePassword(
      body.userId,
      body.currentPassword,
      body.newPassword,
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
