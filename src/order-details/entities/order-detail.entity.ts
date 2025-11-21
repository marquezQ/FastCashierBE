import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn({ name: 'id_detail' })
  idDetail: number;

  @Column({ name: 'order_id', type: 'int' })
  orderId: number;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // Relación: Muchos detalles pertenecen a una orden
  @ManyToOne(() => Order, (order) => order.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Nota: La relación con Product la haremos cuando implementemos productos
  // @ManyToOne(() => Product, { nullable: false })
  // @JoinColumn({ name: 'product_id' })
  // product: Product;
}
