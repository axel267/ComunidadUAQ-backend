import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Facultade } from '../facultades/entities/facultade.entity';

@Entity('usuarios')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    expediente: number;

    @Column()
    nombre: string;

    @Column({ name: 'correo', unique: true })
    email: string;

    @Column({ name: 'contrasena' })
    pass: string;

    @ManyToMany(() => Facultade)
    @JoinTable({
        name: 'usuarios_facultades',
        joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'facultad_id', referencedColumnName: 'id' }
    })
    facultades: Facultade[];

    @Column({ name: 'rol_id', type: 'int', nullable: true })
    rolId: number;

    @Column({ name: 'estado_activo', default: true })
    estadoActivo: boolean;

    @CreateDateColumn({ name: 'fecha_creacion' })
    fechaCreacion: Date;
}