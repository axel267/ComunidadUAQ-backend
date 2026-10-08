import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Facultade } from '../../facultades/entities/facultade.entity';
import { User } from '../../sessions/user.entity';

export enum NivelUrgencia {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export enum EstadoPublicacion {
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

  @Column({ type: 'enum', enum: NivelUrgencia })
  urgencia: NivelUrgencia;

  @Column({ name: 'imagenes_portada_url', type: 'varchar', length: 255, nullable: true })
  imagenesPortadaUrl: string;

  @ManyToOne(() => Facultade)
  @JoinColumn({ name: 'facultad_id' })
  facultad: Facultade;

  @Column({ name: 'facultad_id', type: 'int', nullable: true })
  facultadId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @Column({ name: 'autor_id', type: 'int', nullable: true })
  autorId: number;

  @CreateDateColumn({ name: 'fecha_publicacion' })
  fechaPublicacion: Date;

  @Column({ name: 'estado_publicacion', type: 'enum', enum: EstadoPublicacion, default: EstadoPublicacion.PENDIENTE })
  estadoPublicacion: EstadoPublicacion;

  @Column({ name: 'observaciones_ia', type: 'text', nullable: true })
  observacionesIa: string;
}
