import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../sessions/user.entity';
import { ForoComentario } from './foro-comentario.entity';

@Entity('foro_publicaciones')
export class ForoPublicacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ name: 'imagenes_url', type: 'varchar', length: 255, nullable: true })
  imagenesUrl: string;

  @Column({ name: 'autor_id', type: 'int', nullable: true })
  autorId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @Column({ type: 'varchar', length: 100, default: 'General' })
  categoria: string;

  @Column({ type: 'int', default: 0 })
  votos: number;

  @Column({ name: 'es_fijado', type: 'boolean', default: false })
  esFijado: boolean;

  @Column({ name: 'esta_cerrado', type: 'boolean', default: false })
  estaCerrado: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @OneToMany(() => ForoComentario, (comentario) => comentario.publicacion)
  comentarios: ForoComentario[];
}
