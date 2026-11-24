import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'node:crypto';
import { User } from './user.entity';
import { MailService } from '../mail/mail.service';
import { RoleId } from '../auth/constants/roles.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailService: MailService,
    private jwtService: JwtService,
  ) { }

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
    const pick = (chars: string) => chars[randomInt(chars.length)];
    const mandatoryChars = [
      pick(uppercase),
      pick(lowercase),
      pick(numbers),
      pick(special),
    ];

    const extraChars = Array.from({ length: 4 }, () => pick(allChars));

    // Mezclar todo para evitar patrones predecibles
    const combined = [...mandatoryChars, ...extraChars];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  }

  // ─── Iniciar sesión ─────────────────────────────────────────────────────────

  async createSession(
    expediente?: number,
    email?: string,
    pass?: string,
    identificador?: string,
    password?: string,
  ) {
    const rawPass = pass || password;
    if (!rawPass) {
      throw new BadRequestException('La contraseña es requerida');
    }

    let searchEmail = email?.trim().toLowerCase();
    let searchExpediente = expediente;

    if (identificador) {
      const trimmed = identificador.trim();
      if (trimmed.includes('@')) {
        searchEmail = trimmed.toLowerCase();
      } else if (!isNaN(Number(trimmed))) {
        searchExpediente = Number(trimmed);
      } else {
        searchEmail = trimmed.toLowerCase();
      }
    } else if (email && !email.includes('@') && !isNaN(Number(email.trim()))) {
      searchExpediente = Number(email.trim());
      searchEmail = undefined;
    }

    if (!searchEmail && !searchExpediente) {
      throw new BadRequestException('Debe ingresar su correo institucional o expediente');
    }

    const where: any = {};
    if (searchEmail) where.email = searchEmail;
    if (searchExpediente) where.expediente = searchExpediente;

    const user = await this.usersRepository.findOne({
      where,
      relations: { rol: true, facultades: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.estadoActivo) {
      throw new UnauthorizedException('La cuenta de usuario está desactivada');
    }

    const passwordMatch = await bcrypt.compare(rawPass, user.pass);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar el payload y firmar el token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      expediente: user.expediente,
      rolId: user.rolId,
      rol: user.rol?.nombre,
      area: user.area,
      carrera: user.carrera,
      facultades: user.facultades?.map((f) => f.id) || [],
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Sesión iniciada exitosamente',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        expediente: user.expediente,
        rolId: user.rolId,
        rol: user.rol ? user.rol.nombre : null,
        area: user.area,
        carrera: user.carrera,
        semestre: user.semestre,
        campus: user.campus,
        biografia: user.biografia,
        telefono: user.telefono,
        intereses: user.intereses,
        facultades: user.facultades,
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
    area?: string,
    carrera?: string,
    perfil: {
      semestre?: string;
      campus?: string;
      biografia?: string;
      telefono?: string;
      intereses?: string[];
    } = {},
  ) {
    // 1. Validar dominio institucional obligatorio (@uaq.mx o @alumnos.uaq.mx)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(uaq\.mx|alumnos\.uaq\.mx)$/i;
    if (!emailRegex.test(email)) {
      throw new BadRequestException(
        'El correo debe pertenecer al dominio institucional (@uaq.mx o @alumnos.uaq.mx).',
      );
    }

    // 2. Validación académica de condición activa:
    // Los correos con dominio de alumno (@alumnos.uaq.mx) solo pueden asignarse con rol Estudiante
    const esCorreoAlumno = email.toLowerCase().endsWith('@alumnos.uaq.mx');
    if (esCorreoAlumno && rolId !== RoleId.ESTUDIANTE) {
      throw new BadRequestException(
        'Validación académica: Los correos con dominio @alumnos.uaq.mx solo pueden asignarse con el rol de Estudiante.',
      );
    }

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
        area: area?.trim() || null,
        carrera: carrera?.trim() || null,
        semestre: perfil.semestre?.trim() || null,
        campus: perfil.campus?.trim() || null,
        biografia: perfil.biografia?.trim() || null,
        telefono: perfil.telefono?.trim() || null,
        intereses: perfil.intereses?.filter((interes) => interes.trim()) || null,
        estadoActivo: true,
      });

      const savedUser = await this.usersRepository.save(newUser);

      const resultadoCorreo = await this.mailService.sendWelcomePassword(
        email,
        nombre,
        rawPassword,
      );
      if (!resultadoCorreo.sent) {
        this.logger.error(
          `[Registro] Fallo al enviar contrasena temporal a ${email}: ${resultadoCorreo.error || 'sin detalle'}`,
        );
        const rollback = await this.usersRepository.delete(savedUser.id);
        if (!rollback.affected) {
          throw new InternalServerErrorException(
            'No se pudo enviar el correo ni revertir la creación de la cuenta. Contacta a soporte.',
          );
        }
        throw new ServiceUnavailableException(
          'No se pudo enviar la contraseña temporal por correo. La cuenta no fue creada; inténtalo más tarde.',
        );
      }

      return {
        message:
          'Cuenta creada exitosamente. Se ha enviado una contraseña temporal al correo registrado.',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          nombre: savedUser.nombre,
          expediente: savedUser.expediente,
          rolId: savedUser.rolId,
          area: savedUser.area,
          carrera: savedUser.carrera,
          semestre: savedUser.semestre,
          campus: savedUser.campus,
          biografia: savedUser.biografia,
          telefono: savedUser.telefono,
          intereses: savedUser.intereses,
        },
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const databaseErrorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : undefined;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        databaseErrorCode === '23503' ||
        errorMessage.includes('violates foreign key constraint')
      ) {
        throw new BadRequestException(
          'Una o más de las facultades seleccionadas (o el rol) no existen en el sistema.',
        );
      }

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
    console.log(`\nSIMULACION DE CORREO ENVIADO A: ${email}`);
    console.log(`Haz clic aqui para recuperar tu cuenta: ${resetLink}\n`);

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

  // ─── Actualizar perfil ──────────────────────────────────────────────────────

  async updateProfile(dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id: dto.userId },
      relations: { rol: true, facultades: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.nombre !== undefined) user.nombre = dto.nombre.trim();
    if (dto.carrera !== undefined) user.carrera = dto.carrera.trim();
    if (dto.semestre !== undefined) user.semestre = dto.semestre.trim();
    if (dto.campus !== undefined) user.campus = dto.campus.trim();
    if (dto.biografia !== undefined) user.biografia = dto.biografia.trim();
    if (dto.telefono !== undefined) user.telefono = dto.telefono.trim();
    if (dto.intereses !== undefined) user.intereses = dto.intereses;

    await this.usersRepository.save(user);

    return {
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        expediente: user.expediente,
        rolId: user.rolId,
        rol: user.rol ? user.rol.nombre : null,
        area: user.area,
        carrera: user.carrera,
        semestre: user.semestre,
        campus: user.campus,
        biografia: user.biografia,
        telefono: user.telefono,
        intereses: user.intereses,
        facultades: user.facultades,
      },
    };
  }

  // ─── Obtener usuario por ID ─────────────────────────────────────────────────

  async getUserById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { rol: true, facultades: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      expediente: user.expediente,
      rolId: user.rolId,
      rol: user.rol ? user.rol.nombre : null,
      area: user.area,
      carrera: user.carrera,
      semestre: user.semestre,
      campus: user.campus,
      biografia: user.biografia,
      telefono: user.telefono,
      intereses: user.intereses,
      facultades: user.facultades,
    };
  }
}
