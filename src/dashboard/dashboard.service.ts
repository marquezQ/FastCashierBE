import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { CashierSession } from '../cashier-sessions/entities/cashier-session.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(CashierSession)
    private readonly cashierSessionRepository: Repository<CashierSession>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // --- GENERAL ---
    // todayOrders
    const todayOrdersCount = await this.orderRepository.count({
      where: { orderDate: MoreThanOrEqual(today) },
    });

    // todaySales
    const todaySalesQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.orderDate >= :today', { today })
      .andWhere('order.orderStatus != :status', { status: 'CANCELLED' })
      .getRawOne();
    const todaySales = Number(todaySalesQuery.total || 0);

    // monthlySales
    const monthlySalesQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.orderDate >= :firstDayOfMonth', { firstDayOfMonth })
      .andWhere('order.orderStatus != :status', { status: 'CANCELLED' })
      .getRawOne();
    const monthlySales = Number(monthlySalesQuery.total || 0);

    // totalSessions (historico global del sistema)
    const totalSessions = await this.cashierSessionRepository.count();

    // --- ENTITIES ---
    const totalUsers = await this.userRepository.count();
    const totalProducts = await this.productRepository.count();
    const activeProducts = await this.productRepository.count({ where: { isActive: true } });

    // --- FINANCIAL 7D ---
    const financialQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.paymentMethod', 'method')
      .addSelect('SUM(order.total)', 'total')
      .where('order.orderDate >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('order.orderStatus != :status', { status: 'CANCELLED' })
      .groupBy('order.paymentMethod')
      .getRawMany();

    let totalCash = 0;
    let totalQr = 0;
    financialQuery.forEach((row) => {
      if (row.method === 'CASH') totalCash += Number(row.total);
      if (row.method === 'QR') totalQr += Number(row.total);
    });

    // --- PERFORMANCE 7D ---
    // channels
    const channelsQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderType', 'type')
      .addSelect('COUNT(order.idOrder)', 'count')
      .where('order.orderDate >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('order.orderStatus != :status', { status: 'CANCELLED' })
      .groupBy('order.orderType')
      .getRawMany();

    let totalDineIn = 0;
    let totalTakeout = 0;
    channelsQuery.forEach((row) => {
      if (row.type === 'DINE_IN') totalDineIn += Number(row.count);
      if (row.type === 'TAKEOUT') totalTakeout += Number(row.count);
    });

    const totalChannels = totalDineIn + totalTakeout;
    const dineInPercentage =
      totalChannels > 0 ? Math.round((totalDineIn / totalChannels) * 100) : 0;
    const takeoutPercentage =
      totalChannels > 0 ? Math.round((totalTakeout / totalChannels) * 100) : 0;

    // avgKitchenTimeMinutes for last 7 days
    const kitchenCurrentQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(EXTRACT(EPOCH FROM (order.completedDate - order.orderDate)) / 60)', 'avgTime')
      .where('order.orderDate >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('order.completedDate IS NOT NULL')
      .andWhere('order.orderStatus = :status', { status: 'DELIVERED' })
      .getRawOne();

    const avgKitchenTimeMinutes = Number(kitchenCurrentQuery.avgTime || 0);

    // avgKitchenTimeMinutes for PREVIOUS 7 days (day -14 to day -7)
    const kitchenPreviousQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(EXTRACT(EPOCH FROM (order.completedDate - order.orderDate)) / 60)', 'avgTime')
      .where('order.orderDate >= :fourteenDaysAgo', { fourteenDaysAgo })
      .andWhere('order.orderDate < :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('order.completedDate IS NOT NULL')
      .andWhere('order.orderStatus = :status', { status: 'DELIVERED' })
      .getRawOne();

    const previousAvgKitchenTime = Number(kitchenPreviousQuery.avgTime || 0);

    let kitchenTimeTrendPercentage = 0;
    if (previousAvgKitchenTime > 0) {
      kitchenTimeTrendPercentage = Math.round(
        ((avgKitchenTimeMinutes - previousAvgKitchenTime) / previousAvgKitchenTime) * 100,
      );
    }

    // --- RECENT DISCREPANCIES ---
    const recentDiscrepanciesRaw = await this.cashierSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.status = :status', { status: 'CLOSED' })
      .andWhere('session.closingDate >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('session.difference != 0')
      .orderBy('session.closingDate', 'DESC')
      .limit(5)
      .getMany();

    const recentDiscrepancies = recentDiscrepanciesRaw.map((session) => ({
      idSession: session.idSession,
      cashierName: session.user?.fullName || 'Desconocido',
      date: session.closingDate,
      difference: Number(session.difference),
      status: Number(session.difference) < 0 ? 'faltante' : 'sobrante',
    }));

    return {
      general: {
        todayOrders: todayOrdersCount,
        todaySales: Number(todaySales.toFixed(2)),
        monthlySales: Number(monthlySales.toFixed(2)),
        totalSessions,
      },
      entities: {
        totalUsers,
        totalProducts,
        activeProducts,
      },
      financial7d: {
        totalCash: Number(totalCash.toFixed(2)),
        totalQr: Number(totalQr.toFixed(2)),
      },
      performance7d: {
        avgKitchenTimeMinutes: Math.round(avgKitchenTimeMinutes),
        kitchenTimeTrendPercentage,
        channels: {
          dineInPercentage,
          takeoutPercentage,
        },
      },
      recentDiscrepancies,
    };
  }
}
