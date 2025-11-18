import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  idRol: number;

  @Column({ name: 'nombre_rol', type: 'varchar', length: 50, unique: true })
  nombreRol: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  // Relación: Un rol tiene muchos usuarios
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
