import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Facultade } from '../../facultades/entities/facultade.entity';

@Entity('fechas_clave')
export class FechaClave {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'varchar', length: 50, default: 'General' })
  etiqueta: string;

  @ManyToOne(() => Facultade, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'facultad_id' })
  facultad: Facultade;

  @Column({ name: 'facultad_id', type: 'int', nullable: true })
  facultadId: number;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
