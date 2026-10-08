import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../sessions/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Cambiar contraseña (usuario autenticado).
   * Recibe el ID del usuario, su contraseña actual y la nueva.
   */
  async cambiarContrasena(userId: number, contrasenaActual: string, nuevaContrasena: string, confirmarContrasena: string) {
    // 1. Validar que la nueva contraseña y la confirmación sean iguales
    if (nuevaContrasena !== confirmarContrasena) {
      throw new BadRequestException('La nueva contraseña y la confirmación no coinciden.');
    }

    // 2. Buscar al usuario en la base de datos
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 3. Verificar que la contraseña actual sea correcta comparándola con el hash guardado
    const contrasenaValida = await bcrypt.compare(contrasenaActual, user.pass);
    if (!contrasenaValida) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    // 4. Encriptar la nueva contraseña con bcrypt (salt de 10 rondas)
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // 5. Guardar la nueva contraseña en la base de datos
    user.pass = hashedPassword;
    await this.usersRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente.' };
  }

  /**
   * Recuperar contraseña (olvidé mi contraseña).
   * Genera una contraseña aleatoria, la guarda encriptada y simula el envío por correo.
   */
  async recuperarContrasena(correo: string) {
    // 1. Buscar al usuario por correo
    const user = await this.usersRepository.findOne({ where: { email: correo } });
    if (!user) {
      // Por seguridad, no revelamos si el correo existe o no
      return { message: 'Si el correo está registrado, se ha enviado una contraseña temporal.' };
    }

    // 2. Generar una contraseña aleatoria de 8 caracteres alfanuméricos
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let contrasenaTemporal = '';
    for (let i = 0; i < 8; i++) {
      contrasenaTemporal += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    // 3. Encriptar la contraseña temporal con bcrypt
    const hashedPassword = await bcrypt.hash(contrasenaTemporal, 10);

    // 4. Sobreescribir la contraseña anterior en la base de datos
    user.pass = hashedPassword;
    await this.usersRepository.save(user);

    // 5. Simular el envío de correo (console.log por ahora)
    console.log(`\n========================================`);
    console.log(`SIMULACION DE CORREO ENVIADO`);
    console.log(`Para: ${correo}`);
    console.log(`Asunto: Recuperacion de contrasena - ComunidadUAQ`);
    console.log(`----------------------------------------`);
    console.log(`Tu nueva contrasena temporal es: ${contrasenaTemporal}`);
    console.log(`Por favor, inicia sesion y cambia tu contrasena.`);
    console.log(`========================================\n`);

    return { message: 'Si el correo está registrado, se ha enviado una contraseña temporal.' };
  }
}
