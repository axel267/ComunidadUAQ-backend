import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ForoPublicacion } from './foro-publicacion.entity';
import { User } from '../../sessions/user.entity';

@Entity('foro_comentarios')
export class ForoComentario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'publicacion_id', type: 'int' })
  publicacionId: number;

  @ManyToOne(() => ForoPublicacion, (pub) => pub.comentarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicacion_id' })
  publicacion: ForoPublicacion;

  @Column({ name: 'comentario_padre_id', type: 'int', nullable: true })
  comentarioPadreId: number;

  @ManyToOne(() => ForoComentario, (c) => c.respuestas, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'comentario_padre_id' })
  comentarioPadre: ForoComentario;

  @OneToMany(() => ForoComentario, (c) => c.comentarioPadre)
  respuestas: ForoComentario[];

  @Column({ name: 'autor_id', type: 'int', nullable: true })
  autorId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ name: 'imagenes_url', type: 'varchar', length: 255, nullable: true })
  imagenesUrl: string;

  @Column({ type: 'int', default: 0 })
  votos: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}
