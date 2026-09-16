import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from '../../sessions/user.entity';

@Entity('facultades')
export class Facultade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  abreviatura: string;

  @ManyToMany(() => User, (user) => user.facultades)
  usuarios: User[];
}
