import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'jsonb', nullable: true })
  permisos: Record<string, any>;

  @OneToMany(() => User, (user) => user.rol)
  usuarios: User[];
}

