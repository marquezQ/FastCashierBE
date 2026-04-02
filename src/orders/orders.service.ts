import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, AdminMetricsFilterDto } from './dto';
import { CashierSessionsService } from '../cashier-sessions/cashier-sessions.service';
import { OrderDetailsService } from '../order-details/order-details.service';
import { ProductsService } from '../products/products.service';
import { SelectQueryBuilder } from 'typeorm';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cashierSessionsService: CashierSessionsService,
    private readonly orderDetailsService: OrderDetailsService,
    private readonly productsService: ProductsService,
    private readonly ordersGateway: OrdersGateway,
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

    // Generar número de pedido único basado en la sesión
    const orderNumber = await this.generateOrderNumber(createOrderDto.sessionId);

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

    // Retornar orden con detalles completos (relations cargadas)
    const completedOrder = await this.findOne(savedOrder.idOrder);

    this.ordersGateway.emitNewOrder(completedOrder);

    return completedOrder;
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

    // Marcar como finalizado solo cuando está ENTREGADO
    if (updateStatusDto.orderStatus === 'DELIVERED') {
      order.completedDate = new Date();
    }

    if (updateStatusDto.observations) {
      order.observations = updateStatusDto.observations;
    }

    const updatedOrder = await this.orderRepository.save(order);

    this.ordersGateway.emitOrderStatusUpdated(updatedOrder);

    return updatedOrder;
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

    const updatedOrder = await this.orderRepository.save(order);

    // Notificar a todos los clientes
    this.ordersGateway.emitOrderStatusUpdated(updatedOrder);

    return updatedOrder;
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);

    if (order.orderStatus !== 'CANCELLED') {
      throw new BadRequestException('Only cancelled orders can be deleted');
    }

    await this.orderRepository.remove(order);
  }

  // Métodos auxiliares

  private async generateOrderNumber(sessionId: number): Promise<string> {
    // Contar órdenes de la sesión actual
    const count = await this.orderRepository.count({
      where: {
        sessionId: sessionId,
      },
    });

    const sequential = (count + 1).toString().padStart(3, '0');

    // El formato incluye el ID de sesión para garantizar unicidad histórica
    // Ejemplo: ORD-50-0001 (Orden 1 de la sesión 50)
    return `ORD-S${sessionId}-${sequential}`;
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

  // --- Admin Dashboard Metrics ---

  async getAdminDashboardStats(filter: AdminMetricsFilterDto) {
    // 1. Base Query for Orders
    const ordersQuery = this.orderRepository.createQueryBuilder('order');
    this.applyDateFilter(ordersQuery, filter, 'order.orderDate');

    // 2. Base Summary (Total Sales, Order Count, Avg Ticket)
    const summaryQuery = ordersQuery.clone()
      .select('SUM(order.total)', 'totalSales')
      .addSelect('COUNT(order.idOrder)', 'orderCount')
      .andWhere('order.orderStatus != :status', { status: 'CANCELLED' });

    const summaryResult = await summaryQuery.getRawOne();
    const totalSales = Number(summaryResult.totalSales || 0);
    const orderCount = Number(summaryResult.orderCount || 0);
    const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;

    // 3. Kitchen Performance (Avg prep time in minutes)
    const kitchenQuery = ordersQuery.clone()
      .select('AVG(EXTRACT(EPOCH FROM (order.completedDate - order.orderDate)) / 60)', 'avgTime')
      .andWhere('order.completedDate IS NOT NULL')
      .andWhere('order.orderStatus = :status', { status: 'DELIVERED' });

    const kitchenResult = await kitchenQuery.getRawOne();
    const averageKitchenTime = Number(kitchenResult.avgTime || 0);

    // 4. Channel Distribution (Dine-in vs Takeout)
    const channelQuery = ordersQuery.clone()
      .select('order.orderType', 'type')
      .addSelect('COUNT(order.idOrder)', 'count')
      .andWhere('order.orderStatus != :status', { status: 'CANCELLED' })
      .groupBy('order.orderType');

    const channelResult = await channelQuery.getRawMany();
    const channels = {
      dineIn: Number(channelResult.find(c => c.type === 'DINE_IN')?.count || 0),
      takeout: Number(channelResult.find(c => c.type === 'TAKEOUT')?.count || 0),
    };

    // 5. Top Products (Summing quantities)
    const productQuery = this.orderRepository.manager.createQueryBuilder('OrderDetail', 'detail')
      .innerJoin('detail.order', 'order')
      .innerJoin('detail.product', 'product')
      .select('product.name', 'name')
      .addSelect('product.imageUrl', 'imageUrl')
      .addSelect('SUM(detail.quantity)', 'totalQuantity')
      .where('order.orderStatus != :status', { status: 'CANCELLED' });

    this.applyDateFilter(productQuery, filter, 'order.orderDate');

    productQuery.groupBy('product.idProduct, product.name, product.imageUrl')
      .orderBy('"totalQuantity"', 'DESC');

    const topProducts = await productQuery.getRawMany();

    return {
      summary: {
        totalSales: Number(totalSales.toFixed(2)),
        orderCount,
        averageTicket: Number(averageTicket.toFixed(2)),
      },
      kitchen: {
        averageKitchenTime: Number(averageKitchenTime.toFixed(2)),
      },
      channels,
      topProducts: topProducts.map(p => ({
        name: p.name,
        imageUrl: p.imageUrl,
        totalQuantity: Number(p.totalQuantity),
      })),
    };
  }

  async getCancelledOrdersReport(filter: AdminMetricsFilterDto) {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.cashier', 'cashier')
      .leftJoinAndSelect('order.details', 'details')
      .leftJoinAndSelect('details.product', 'product')
      .where('order.orderStatus = :status', { status: 'CANCELLED' });

    this.applyDateFilter(query, filter, 'order.orderDate');
    query.orderBy('order.orderDate', 'DESC');

    return await query.getMany();
  }

  private applyDateFilter(query: SelectQueryBuilder<any>, filter: AdminMetricsFilterDto, dateField: string) {
    let startDate: Date;
    let endDate: Date = filter.endDate ? new Date(filter.endDate + 'T00:00:00') : new Date();

    if (filter.endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    if (filter.period === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      query.andWhere(`${dateField} >= :startDate`, { startDate });
    } else if (filter.period === '7d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      query.andWhere(`${dateField} >= :startDate`, { startDate });
    } else if (filter.period === 'this-month') {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      query.andWhere(`${dateField} BETWEEN :startDate AND :endDate`, { startDate, endDate });
    } else if (filter.startDate) {
      startDate = new Date(filter.startDate + 'T00:00:00');
      startDate.setHours(0, 0, 0, 0);
      query.andWhere(`${dateField} BETWEEN :startDate AND :endDate`, { startDate, endDate });
    }
  }
}
