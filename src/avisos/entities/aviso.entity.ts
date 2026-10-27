import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../sessions/user.entity';
import { Facultade } from '../../facultades/entities/facultade.entity';

export enum NivelUrgencia {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export enum EstadoModeracion {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity('avisos')
export class Aviso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  contenido: string;

  @Column({
    type: 'enum',
    enum: NivelUrgencia,
    enumName: 'nivel_urgencia',
    default: NivelUrgencia.BAJA,
  })
  urgencia: NivelUrgencia;

  @Column({ name: 'imagenes_portada_url', type: 'varchar', length: 255, nullable: true })
  imagenesPortadaUrl: string;

  @Column({ name: 'facultad_id', type: 'int', nullable: true })
  facultadId: number;

  @ManyToOne(() => Facultade, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'facultad_id' })
  facultad: Facultade;

  @Column({ name: 'autor_id', type: 'int', nullable: true })
  autorId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @CreateDateColumn({ name: 'fecha_publicacion' })
  fechaPublicacion: Date;

  @Column({
    name: 'estado_publicacion',
    type: 'enum',
    enum: EstadoModeracion,
    enumName: 'estado_moderacion',
    default: EstadoModeracion.PENDIENTE,
  })
  estadoPublicacion: EstadoModeracion;

  @Column({ name: 'observaciones_ia', type: 'text', nullable: true })
  observacionesIa: string;
}
