import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('cashier_sessions')
export class CashierSession {
  @PrimaryGeneratedColumn({ name: 'id_session' })
  idSession: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @CreateDateColumn({ name: 'opening_date' })
  openingDate: Date;

  @Column({ name: 'closing_date', type: 'timestamp', nullable: true })
  closingDate: Date;

  @Column({
    name: 'initial_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  initialAmount: number;

  @Column({
    name: 'total_cash',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalCash: number;

  @Column({
    name: 'total_qr',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalQr: number;

  @Column({
    name: 'closing_cash_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  closingCashAmount: number;

  @Column({
    name: 'closing_qr_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  closingQrAmount: number;

  @Column({
    name: 'total_sales',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalSales: number;

  @Column({ name: 'order_count', type: 'int', default: 0 })
  orderCount: number;

  @Column({
    name: 'difference',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  difference: number;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: string;

  // Relación: Muchas sesiones pertenecen a un usuario
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
