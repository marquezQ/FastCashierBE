import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ name: 'id_role' })
  idRole: number;

  @Column({ name: 'role_name', type: 'varchar', length: 50, unique: true })
  roleName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relación: Un rol tiene muchos usuarios
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
