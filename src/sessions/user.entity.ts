import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

    @Column({ name: 'facultad_id', type: 'int', nullable: true })
    facultadId: number;

    @Column({ name: 'rol_id', type: 'int', nullable: true })
    rolId: number;

    @Column({ name: 'estado_activo', default: true })
    estadoActivo: boolean;

    @CreateDateColumn({ name: 'fecha_creacion' })
    fechaCreacion: Date;
}