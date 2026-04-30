import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('display_configs')
export class DisplayConfig {
  @PrimaryGeneratedColumn({ name: 'id_display_config' })
  idDisplayConfig: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'access_token', type: 'varchar', length: 10, unique: true })
  accessToken: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number | null;

  @Column({ name: 'rotation_interval', type: 'int', default: 8 })
  rotationInterval: number;

  @Column({ name: 'transition_type', type: 'varchar', length: 20, default: 'slide' })
  transitionType: string;

  @Column({ name: 'show_prices', type: 'boolean', default: true })
  showPrices: boolean;

  @Column({ name: 'show_descriptions', type: 'boolean', default: false })
  showDescriptions: boolean;

  @Column({ name: 'products_per_slide', type: 'int', default: 3 })
  productsPerSlide: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relación: muchas configs pueden apuntar a una categoría (nullable)
  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
