import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CashierSession } from '../../cashier-sessions/entities/cashier-session.entity';
import { OrderDetail } from '../../order-details/entities/order-detail.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ name: 'id_order' })
  idOrder: number;

  @Column({ name: 'order_number', type: 'varchar', length: 20, unique: true })
  orderNumber: string;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @Column({ name: 'cashier_id', type: 'int' })
  cashierId: number;

  @Column({ name: 'cook_id', type: 'int', nullable: true })
  cookId: number;

  @CreateDateColumn({ name: 'order_date' })
  orderDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'payment_method', type: 'varchar', length: 20 })
  paymentMethod: string;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amountPaid: number;

  @Column({
    name: 'change_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  changeAmount: number;

  @Column({
    name: 'order_status',
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  orderStatus: string;

  @Column({
    name: 'preparation_start_date',
    type: 'timestamp',
    nullable: true,
  })
  preparationStartDate: Date;

  @Column({ name: 'completed_date', type: 'timestamp', nullable: true })
  completedDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customer: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => CashierSession, { nullable: false })
  @JoinColumn({ name: 'session_id' })
  session: CashierSession;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cook_id' })
  cook: User;

  //Una orden tiene muchos detalles
  @OneToMany(() => OrderDetail, (detail) => detail.order, {
    cascade: true,
    eager: true,
  })
  details: OrderDetail[];
}
