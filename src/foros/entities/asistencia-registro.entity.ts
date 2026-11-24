import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('asistencias_lista')
export class AsistenciaRegistro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'estudiante_id', type: 'int', nullable: true })
  estudianteId: number | null;

  @Column({ type: 'varchar', length: 64 })
  expediente: string;

  @Column({ name: 'nombre_estudiante', type: 'varchar', length: 255 })
  nombreEstudiante: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  carrera: string | null;

  @Column({ name: 'evento_titulo', type: 'varchar', length: 255, default: 'Pase de lista general' })
  eventoTitulo: string;

  @Column({ name: 'tomado_por_id', type: 'int', nullable: true })
  tomadoPorId: number | null;

  @Column({ name: 'tomado_por_nombre', type: 'varchar', length: 255 })
  tomadoPorNombre: string;

  @Column({ name: 'puntos_otorgados', type: 'int', default: 100 })
  puntosOtorgados: number;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;
}
