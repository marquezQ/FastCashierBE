import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from './entities/order-detail.entity';
import { CreateOrderDetailDto } from './dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrderDetailsService {
  constructor(
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
  ) {}

  async createDetails(
    orderId: number,
    items: CreateOrderDetailDto[],
    products: Product[],
  ): Promise<OrderDetail[]> {
    const details = items.map((item) => {
      // Buscar el producto correspondiente
      const product = products.find((p) => p.idProduct === item.productId);

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      // Usar el precio actual del producto
      const unitPrice = Number(product.price);
      const subtotal = item.quantity * unitPrice;

      return this.orderDetailRepository.create({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    });

    return await this.orderDetailRepository.save(details);
  }

  async findByOrder(orderId: number): Promise<OrderDetail[]> {
    return await this.orderDetailRepository.find({
      where: { orderId },
      relations: ['product'],
      order: { idDetail: 'ASC' },
    });
  }

  async findOne(id: number): Promise<OrderDetail> {
    const detail = await this.orderDetailRepository.findOne({
      where: { idDetail: id },
      relations: ['product'],
    });

    if (!detail) {
      throw new NotFoundException(`Order detail with ID ${id} not found`);
    }

    return detail;
  }

  async calculateOrderTotals(
    items: CreateOrderDetailDto[],
    products: Product[],
  ): Promise<{
    subtotal: number;
    total: number;
  }> {
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.idProduct === item.productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }
      return sum + item.quantity * Number(product.price);
    }, 0);

    const total = subtotal;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  async remove(id: number): Promise<void> {
    const detail = await this.findOne(id);
    await this.orderDetailRepository.remove(detail);
  }
}
