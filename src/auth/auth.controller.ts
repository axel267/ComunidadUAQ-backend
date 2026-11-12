import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionsService } from '../sessions/sessions.service';
import { CreateSessionDto } from '../sessions/dto/create-session.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { RecuperarContrasenaDto } from './dto/recuperar-contrasena.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
  ) {}

  /**
   * POST /auth/login
   * Permite iniciar sesión enviando { email o expediente, password o pass }
   */
  @Public()
  @Post('login')
  login(@Body() body: CreateSessionDto) {
    return this.sessionsService.createSession(
      body.expediente,
      body.email,
      body.pass,
      body.identificador,
      body.password,
    );
  }

  /**
   * POST /auth/cambiar-contrasena
   * Body: { userId, contrasenaActual, nuevaContrasena, confirmarContrasena }
   * 
   * Nota: En un sistema real, el userId se obtendría del token JWT del usuario autenticado.
   * Por ahora se recibe en el body para poder probarlo fácilmente.
   */
  @Post('cambiar-contrasena')
  cambiarContrasena(@Body() body: CambiarContrasenaDto & { userId: number }) {
    return this.authService.cambiarContrasena(
      body.userId,
      body.contrasenaActual,
      body.nuevaContrasena,
      body.confirmarContrasena,
    );
  }

  /**
   * POST /auth/recuperar-contrasena
   * Body: { correo }
   */
  @Post('recuperar-contrasena')
  recuperarContrasena(@Body() body: RecuperarContrasenaDto) {
    return this.authService.recuperarContrasena(body.correo);
  }
}
