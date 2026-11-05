import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, ManyToOne, JoinColumn, JoinTable } from 'typeorm';
import { Facultade } from '../facultades/entities/facultade.entity';
import { Role } from './role.entity';

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

    @ManyToOne(() => Role, (role) => role.usuarios, { nullable: true })
    @JoinColumn({ name: 'rol_id' })
    rol: Role;

    @Column({ name: 'area', type: 'varchar', length: 150, nullable: true })
    area: string;

    @Column({ name: 'carrera', type: 'varchar', length: 150, nullable: true })
    carrera: string;

    @Column({ name: 'estado_activo', default: true })
    estadoActivo: boolean;

    @CreateDateColumn({ name: 'fecha_creacion' })
    fechaCreacion: Date;
}