import { Injectable, UnauthorizedException } from '@nestjs/common';
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
}
