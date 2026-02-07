import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from './dto';
import { CashierSessionsService } from '../cashier-sessions/cashier-sessions.service';
import { OrderDetailsService } from '../order-details/order-details.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cashierSessionsService: CashierSessionsService,
    private readonly orderDetailsService: OrderDetailsService,
    private readonly productsService: ProductsService,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Verificar que la sesión exista y esté abierta
    const session = await this.cashierSessionsService.findOne(
      createOrderDto.sessionId,
    );

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Cannot create order in a closed session');
    }

    // Obtener productos y validar disponibilidad
    const productIds = createOrderDto.items.map((item) => item.productId);
    const products = await this.productsService.findByIds(productIds);

    // Calcular totales desde los productos
    const { subtotal, total } =
      await this.orderDetailsService.calculateOrderTotals(
        createOrderDto.items,
        products,
      );

    // Calcular cambio si es efectivo
    let changeAmount = 0;
    if (createOrderDto.paymentMethod === 'CASH') {
      changeAmount = createOrderDto.amountPaid - total;
      if (changeAmount < 0) {
        throw new BadRequestException('Amount paid is less than total');
      }
    }

    // Generar número de pedido único
    const orderNumber = await this.generateOrderNumber();

    // Crear orden
    const order = this.orderRepository.create({
      orderNumber,
      sessionId: createOrderDto.sessionId,
      cashierId: createOrderDto.cashierId,
      subtotal,
      total,
      paymentMethod: createOrderDto.paymentMethod,
      amountPaid: createOrderDto.amountPaid,
      changeAmount,
      customer: createOrderDto.customer,
      observations: createOrderDto.observations,
      orderType: createOrderDto.orderType,
      orderStatus: 'PENDING',
    });

    // Guardar orden
    const savedOrder = await this.orderRepository.save(order);

    // Crear detalles de la orden con los productos
    await this.orderDetailsService.createDetails(
      savedOrder.idOrder,
      createOrderDto.items,
      products,
    );

    // Actualizar totales de la sesión
    await this.cashierSessionsService.addOrderToSession(
      createOrderDto.sessionId,
      total,
      createOrderDto.paymentMethod as 'CASH' | 'QR',
    );

    // Retornar orden con detalles
    return await this.findOne(savedOrder.idOrder);
  }

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
      order: { orderDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { idOrder: id },
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }

  async findBySession(sessionId: number): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { sessionId },
      relations: ['cashier', 'cook', 'details', 'details.product'],
      order: { orderDate: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { orderStatus: status },
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
      order: { orderDate: 'DESC' },
    });
  }

  async findPendingOrders(): Promise<Order[]> {
    return await this.orderRepository.find({
      where: [{ orderStatus: 'PENDING' }, { orderStatus: 'IN_PREPARATION' }],
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
      order: { orderDate: 'ASC' },
    });
  }

  async getKitchenDisplayOrders(): Promise<Order[]> {
    const eighteenHoursAgo = new Date();
    eighteenHoursAgo.setHours(eighteenHoursAgo.getHours() - 18);

    return await this.orderRepository.find({
      where: {
        orderStatus: In(['PENDING', 'IN_PREPARATION', 'READY']),
        orderDate: MoreThanOrEqual(eighteenHoursAgo),
      },
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
      order: {
        orderDate: 'ASC', // FIFO logic
      },
    });
  }

  async getKitchenHistoryOrders(): Promise<Order[]> {
    const eighteenHoursAgo = new Date();
    eighteenHoursAgo.setHours(eighteenHoursAgo.getHours() - 18);

    return await this.orderRepository.find({
      where: {
        orderStatus: In(['DELIVERED', 'CANCELLED']),
        orderDate: MoreThanOrEqual(eighteenHoursAgo),
      },
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
      order: {
        orderDate: 'DESC', // LIFO logic - Most recent first
      },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return await this.orderRepository.find({
      where: {
        orderDate: Between(startDate, endDate),
      },
      relations: ['session', 'cashier', 'cook', 'details', 'details.product'],
      order: { orderDate: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id);

    // Validar transiciones de estado
    this.validateStatusTransition(
      order.orderStatus,
      updateStatusDto.orderStatus,
    );

    // Actualizar estado
    order.orderStatus = updateStatusDto.orderStatus;

    // Asignar cocinero si pasa a EN_PREPARACION
    if (
      updateStatusDto.orderStatus === 'IN_PREPARATION' &&
      updateStatusDto.cookId
    ) {
      order.cookId = updateStatusDto.cookId;
      order.preparationStartDate = new Date();
    }

    // Marcar como finalizado si está LISTO o ENTREGADO
    if (
      updateStatusDto.orderStatus === 'READY' ||
      updateStatusDto.orderStatus === 'DELIVERED'
    ) {
      if (!order.completedDate) {
        order.completedDate = new Date();
      }
    }

    if (updateStatusDto.observations) {
      order.observations = updateStatusDto.observations;
    }

    return await this.orderRepository.save(order);
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // No permitir actualizar si ya fue entregado o cancelado
    if (
      order.orderStatus === 'DELIVERED' ||
      order.orderStatus === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Cannot update a delivered or cancelled order',
      );
    }

    this.orderRepository.merge(order, updateOrderDto);
    return await this.orderRepository.save(order);
  }

  async cancel(id: number, reason?: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.orderStatus === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel a delivered order');
    }

    if (order.orderStatus === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }

    // Restar de la sesión de caja
    await this.cashierSessionsService.deductOrderFromSession(
      order.sessionId,
      order.total,
      order.paymentMethod as 'CASH' | 'QR',
    );

    order.orderStatus = 'CANCELLED';
    if (reason) {
      order.observations = reason;
    }

    return await this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);

    if (order.orderStatus !== 'CANCELLED') {
      throw new BadRequestException('Only cancelled orders can be deleted');
    }

    await this.orderRepository.remove(order);
  }

  // Métodos auxiliares

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    // Contar órdenes del día
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.orderRepository.count({
      where: {
        orderDate: Between(startOfDay, endOfDay),
      },
    });

    const sequential = (count + 1).toString().padStart(4, '0');
    return `ORD-${year}${month}${day}-${sequential}`;
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const validTransitions: { [key: string]: string[] } = {
      PENDING: ['IN_PREPARATION', 'CANCELLED'],
      IN_PREPARATION: ['READY', 'CANCELLED'],
      READY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  // Reportes y estadísticas

  async getOrderStats(sessionId?: number) {
    const whereCondition = sessionId ? { sessionId } : {};

    const [
      totalOrders,
      pendingOrders,
      inPreparationOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      this.orderRepository.count({ where: whereCondition }),
      this.orderRepository.count({
        where: { ...whereCondition, orderStatus: 'PENDING' },
      }),
      this.orderRepository.count({
        where: { ...whereCondition, orderStatus: 'IN_PREPARATION' },
      }),
      this.orderRepository.count({
        where: { ...whereCondition, orderStatus: 'READY' },
      }),
      this.orderRepository.count({
        where: { ...whereCondition, orderStatus: 'DELIVERED' },
      }),
      this.orderRepository.count({
        where: { ...whereCondition, orderStatus: 'CANCELLED' },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      inPreparationOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      activeOrders: pendingOrders + inPreparationOrders + readyOrders,
    };
  }
}
