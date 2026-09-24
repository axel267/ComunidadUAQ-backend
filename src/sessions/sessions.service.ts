import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async createSession(expediente: number, email: string, pass: string) {
    // Buscar al usuario por email y expediente
    const user = await this.usersRepository.findOne({ where: { email, expediente } });
    
    // Verificar si el usuario existe y la contraseña coincide (Se recomienda usar bcrypt aquí)
    if (user && user.pass === pass) {
      return {
        message: 'Sesión iniciada exitosamente',
        user: { 
          id: user.id, 
          email: user.email, 
          expediente: user.expediente 
        }
      };
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  async createAccount(expediente: number, email: string, pass: string, nombre: string, facultadesIds: number[], rolId: number) {
    try {
      // Verificar si el usuario ya existe (por correo o expediente)
      const existingUser = await this.usersRepository.findOne({ 
        where: [{ email }, { expediente }] 
      });
      
      if (existingUser) {
        throw new BadRequestException('El correo o expediente ya están registrados');
      }

      // Crear la nueva entidad de usuario
      const newUser = this.usersRepository.create({
        expediente,
        email,
        pass, // Recuerda encriptar esto con bcrypt en el futuro
        nombre,
        facultades: facultadesIds.map(id => ({ id })),
        rolId,
        estadoActivo: true
      });

      // Guardar en la base de datos
      await this.usersRepository.save(newUser);

      return {
        message: 'Cuenta creada exitosamente',
        user: {
          id: newUser.id,
          email: newUser.email,
          nombre: newUser.nombre,
          expediente: newUser.expediente
        }
      };
    } catch (error: any) {
      // Manejar error de llave foránea (facultad o rol que no existe)
      if (error.code === '23503' || (error.message && error.message.includes('violates foreign key constraint'))) {
        throw new BadRequestException('Una o más de las facultades seleccionadas (o el rol) no existen en el sistema.');
      }

      // Retornar el mensaje exacto del error para saber qué falló
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Fallo al crear la cuenta: ${errorMessage}`);
    }
  }

  // PASO 1: Generar el link con el Token
  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Por seguridad, siempre decimos que si el correo existe se envió el link, 
      // para no revelar qué correos están registrados.
      return { message: 'Si el correo está registrado, se ha enviado un enlace de recuperación.' };
    }

    // Creamos el payload del token (solo guardamos el ID del usuario)
    const payload = { sub: user.id };
    
    // Firmamos el token
    const token = this.jwtService.sign(payload);

    // Aquí normalmente enviarías el correo con Nodemailer. 
    // Por ahora simularemos el correo imprimiendo el link en la consola.
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log(`\n📧 SIMULACIÓN DE CORREO ENVIADO A: ${email}`);
    console.log(`🔗 Haz clic aquí para recuperar tu cuenta: ${resetLink}\n`);

    return { message: 'Si el correo está registrado, se ha enviado un enlace de recuperación.' };
  }

  // PASO 2: Validar el token cuando el usuario entra al link
  async verifyResetToken(token: string) {
    try {
      // Verifica si el token es válido y no ha expirado
      this.jwtService.verify(token);
      return { message: 'Token válido, puedes proceder a cambiar la contraseña.' };
    } catch (error) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado.');
    }
  }

  // PASO 3: Guardar la nueva contraseña
  async resetPassword(token: string, newPass: string) {
    try {
      // 1. Validamos el token y extraemos los datos
      const payload = this.jwtService.verify(token);
      
      // El 'sub' es el ID del usuario que guardamos al generar el token
      const userId = payload.sub;

      // 2. Buscamos al usuario
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      // 3. Encriptamos la nueva contraseña (Usamos bcrypt)
      // Salt de 10 es el estándar de seguridad recomendado
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPass, saltRounds);

      // 4. Guardamos la nueva contraseña en la base de datos
      user.pass = hashedPassword;
      await this.usersRepository.save(user);

      return { message: 'Contraseña actualizada exitosamente.' };
    } catch (error) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado.');
    }
  }
}
