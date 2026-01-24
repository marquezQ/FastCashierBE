import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderDetail } from '../../order-details/entities/order-detail.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
@Index(['idCategory', 'isActive']) // Índice compuesto para mejorar queries
export class Product {
  @PrimaryGeneratedColumn({ name: 'id_product' })
  idProduct: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'id_category', nullable: true })
  @Index()
  idCategory: number;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relación: Un producto puede estar en muchos detalles de orden
  @OneToMany(() => OrderDetail, (detail) => detail.product)
  orderDetails: OrderDetail[];

  //Relación: Muchos productos pertenecen a una categoría
  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'id_category' })
  category: Category;
}
