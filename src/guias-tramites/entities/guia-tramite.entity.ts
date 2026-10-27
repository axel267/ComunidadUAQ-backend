import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../sessions/user.entity';
import { Facultade } from '../../facultades/entities/facultade.entity';
import { PasoGuia } from './paso-guia.entity';

@Entity('guias_tramites')
export class GuiaTramite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @Column({ name: 'autor_id', type: 'int', nullable: true })
  autorId: number;

  @ManyToOne(() => Facultade)
  @JoinColumn({ name: 'facultad_id' })
  facultad: Facultade;

  @Column({ name: 'facultad_id', type: 'int', nullable: true })
  facultadId: number;

  @Column({ name: 'imagen_url', type: 'varchar', length: 255, nullable: true })
  imagenUrl: string;

  // Relación 1:N — Una guía tiene muchos pasos
  // cascade: true permite guardar los pasos automáticamente al guardar la guía
  @OneToMany(() => PasoGuia, (paso) => paso.guia, { cascade: true })
  pasos: PasoGuia[];
}
