import { Controller, Post, Body, Get, Query, Patch, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RegisterSessionDto } from './dto/register-session.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  /** POST /sessions y POST /sessions/login — Iniciar sesión */
  @Post()
  create(@Body() body: CreateSessionDto) {
    return this.sessionsService.createSession(
      body.expediente,
      body.email,
      body.pass,
      body.identificador,
      body.password,
    );
  }

  @Post('login')
  login(@Body() body: CreateSessionDto) {
    return this.create(body);
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
      body.area,
      body.carrera,
      {
        semestre: body.semestre,
        campus: body.campus,
        biografia: body.biografia,
        telefono: body.telefono,
        intereses: body.intereses,
      },
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

  /** PATCH /sessions/profile — Actualizar datos del perfil */
  @Patch('profile')
  updateProfile(@Body() body: UpdateProfileDto) {
    return this.sessionsService.updateProfile(body);
  }

  /** GET /sessions/user/:id — Obtener datos actualizados del usuario */
  @Get('user/:id')
  getUser(@Param('id') id: string) {
    return this.sessionsService.getUserById(Number(id));
  }
}
