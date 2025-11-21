import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from './entities/order-detail.entity';
import { CreateOrderDetailDto } from './dto';

@Injectable()
export class OrderDetailsService {
  constructor(
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
  ) {}

  async createDetails(
    orderId: number,
    items: CreateOrderDetailDto[],
  ): Promise<OrderDetail[]> {
    const details = items.map((item) => {
      const subtotal = item.quantity * item.unitPrice;

      return this.orderDetailRepository.create({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
      });
    });

    return await this.orderDetailRepository.save(details);
  }

  async findByOrder(orderId: number): Promise<OrderDetail[]> {
    return await this.orderDetailRepository.find({
      where: { orderId },
      order: { idDetail: 'ASC' },
    });
  }

  async findOne(id: number): Promise<OrderDetail> {
    const detail = await this.orderDetailRepository.findOne({
      where: { idDetail: id },
    });

    if (!detail) {
      throw new NotFoundException(`Order detail with ID ${id} not found`);
    }

    return detail;
  }

  async calculateOrderTotals(items: CreateOrderDetailDto[]): Promise<{
    subtotal: number;
    total: number;
  }> {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Por ahora subtotal = total
    // En el futuro aquí podrías agregar descuentos, impuestos, etc.
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
