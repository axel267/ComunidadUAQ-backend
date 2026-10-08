import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GuiaTramite } from './guia-tramite.entity';

@Entity('pasos_guia')
export class PasoGuia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GuiaTramite, (guia) => guia.pasos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guia_id' })
  guia: GuiaTramite;

  @Column({ name: 'guia_id', type: 'int' })
  guiaId: number;

  @Column({ name: 'orden_paso', type: 'int', nullable: true })
  ordenPaso: number;

  @Column({ name: 'imagenes_url', type: 'varchar', length: 255, nullable: true })
  imagenesUrl: string;

  @Column({ name: 'titulo_paso', type: 'varchar', length: 255, nullable: true })
  tituloPaso: string;

  @Column({ name: 'descripcion_detallada', type: 'text', nullable: true })
  descripcionDetallada: string;

  @Column({ name: 'imagen_ilustrativa_url', type: 'varchar', length: 255, nullable: true })
  imagenIlustrativaUrl: string;
}
