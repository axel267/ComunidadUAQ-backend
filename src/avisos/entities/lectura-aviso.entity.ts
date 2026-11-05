import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Aviso } from './aviso.entity';
import { User } from '../../sessions/user.entity';

@Entity('lecturas_avisos')
export class LecturaAviso {
  @PrimaryColumn({ name: 'aviso_id', type: 'int' })
  avisoId: number;

  @PrimaryColumn({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @CreateDateColumn({ name: 'fecha_lectura' })
  fechaLectura: Date;

  @ManyToOne(() => Aviso, (aviso) => aviso.lecturas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aviso_id' })
  aviso: Aviso;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}
