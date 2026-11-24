import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../sessions/user.entity';
import { Facultade } from '../../facultades/entities/facultade.entity';
import { LecturaAviso } from './lectura-aviso.entity';

export enum NivelUrgencia {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
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

  @Column({ name: 'es_comunicado_oficial', type: 'boolean', default: false })
  esComunicadoOficial: boolean;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'resumen', type: 'varchar', length: 500, nullable: true })
  resumen: string | null;

  @Column({ name: 'fecha_limite', type: 'date', nullable: true })
  fechaLimite: string | null;

  @Column({ name: 'adjunto_url', type: 'varchar', length: 255, nullable: true })
  adjuntoUrl: string | null;

  @Column({ name: 'adjunto_nombre', type: 'varchar', length: 255, nullable: true })
  adjuntoNombre: string | null;

  @Column({ name: 'adjunto_tamano', type: 'int', nullable: true })
  adjuntoTamano: number | null;

  @OneToMany(() => LecturaAviso, (lectura) => lectura.aviso)
  lecturas: LecturaAviso[];
}
