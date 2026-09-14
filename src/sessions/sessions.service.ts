import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

  async createAccount(expediente: number, email: string, pass: string, nombre: string, facultadId: number, rolId: number) {
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
        facultadId,
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
    } catch (error) {
      // Retornar el mensaje exacto del error para saber qué falló
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Fallo al crear la cuenta: ${errorMessage}`);
    }
  }
}
