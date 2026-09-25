import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  // ─── Utilidades ─────────────────────────────────────────────────────────────

  /**
   * Genera una contraseña aleatoria de 8 caracteres que incluye
   * letras mayúsculas, minúsculas, números y caracteres especiales.
   */
  private generateRandomPassword(): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';

    const allChars = uppercase + lowercase + numbers + special;

    // Garantizar al menos 1 carácter de cada grupo
    const mandatoryChars = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ];

    // Rellenar los 4 caracteres restantes aleatoriamente
    const extraChars = Array.from({ length: 4 }, () =>
      allChars[Math.floor(Math.random() * allChars.length)],
    );

    // Mezclar todo para evitar patrones predecibles
    const combined = [...mandatoryChars, ...extraChars];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  }

  // ─── Iniciar sesión ─────────────────────────────────────────────────────────

  async createSession(expediente: number, email: string, pass: string) {
    const user = await this.usersRepository.findOne({
      where: { email, expediente },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(pass, user.pass);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      message: 'Sesión iniciada exitosamente',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        expediente: user.expediente,
      },
    };
  }

  // ─── Crear cuenta ───────────────────────────────────────────────────────────

  async createAccount(
    expediente: number,
    email: string,
    nombre: string,
    facultadesIds: number[],
    rolId: number,
  ) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.usersRepository.findOne({
        where: [{ email }, { expediente }],
      });

      if (existingUser) {
        throw new BadRequestException(
          'El correo o expediente ya están registrados',
        );
      }

      // Generar contraseña aleatoria y hashearla
      const rawPassword = this.generateRandomPassword();
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      // Crear y guardar el usuario
      const newUser = this.usersRepository.create({
        expediente,
        email,
        pass: hashedPassword,
        nombre,
        facultades: facultadesIds.map((id) => ({ id })),
        rolId,
        estadoActivo: true,
      });

      await this.usersRepository.save(newUser);

      // Enviar contraseña temporal por correo
      await this.mailService.sendWelcomePassword(email, nombre, rawPassword);

      return {
        message:
          'Cuenta creada exitosamente. Se ha enviado una contraseña temporal al correo registrado.',
        user: {
          id: newUser.id,
          email: newUser.email,
          nombre: newUser.nombre,
          expediente: newUser.expediente,
        },
      };
    } catch (error: any) {
      if (
        error.code === '23503' ||
        (error.message &&
          error.message.includes('violates foreign key constraint'))
      ) {
        throw new BadRequestException(
          'Una o más de las facultades seleccionadas (o el rol) no existen en el sistema.',
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Fallo al crear la cuenta: ${errorMessage}`);
    }
  }

  // ─── Cambiar contraseña ─────────────────────────────────────────────────────

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, user.pass);
    if (!passwordMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'La nueva contraseña debe tener al menos 8 caracteres',
      );
    }

    // Hashear y guardar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.pass = hashedPassword;
    await this.usersRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
