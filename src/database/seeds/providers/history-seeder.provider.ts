import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { historicalData } from '../data/history.data';
import { CashierSession } from '../../../cashier-sessions/entities/cashier-session.entity';
import { Order } from '../../../orders/entities/order.entity';
import { CashierSessionsService } from '../../../cashier-sessions/cashier-sessions.service';
import { OrdersService } from '../../../orders/orders.service';

@Injectable()
export class HistorySeederProvider {
  private readonly logger = new Logger(HistorySeederProvider.name);

  constructor(
    @InjectRepository(CashierSession)
    private readonly sessionRepository: Repository<CashierSession>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    // Usamos los servicios directamente para que se calculen los totales de caja igual que en producción
    private readonly sessionsService: CashierSessionsService,
    private readonly ordersService: OrdersService,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting Historical Data (Jan/Feb) seeding...');

    for (const dataRecord of historicalData) {
      // 1. Verificar si la sesión ya existe basándonos en la fecha
      const sessionExists = await this.sessionRepository.findOne({
        where: { openingDate: dataRecord.session.openingDate },
      });

      if (!sessionExists) {
        this.logger.debug(`Creating historic session for: ${dataRecord.month}`);

        // A. Insertar la Sesión con STATUS = 'OPEN' (temporalmente) para que OrdersService permita crearlas
        const originalStatus = dataRecord.session.status;
        const sessionPayload = this.sessionRepository.create({
          ...dataRecord.session,
          status: 'OPEN', // Forzamos abierto temporalmente
        });
        const createdSession = await this.sessionRepository.save(sessionPayload);

        // B. Insertar las Órdenes
        for (const orderData of dataRecord.orders) {
          try {
            // Pasamos el ID de la sesión recién creada
            const createdOrder = await this.ordersService.create({
              sessionId: createdSession.idSession,
              cashierId: orderData.cashierId,
              customer: orderData.customer,
              orderType: orderData.orderType as any,
              paymentMethod: orderData.paymentMethod as any,
              amountPaid: orderData.amountPaid,
              items: orderData.items,
            });

            // Truco Senior para Fechas Históricas: En lugar de un .update normal que puede fallar
            // contra los decoradores @CreateDateColumn, forzamos un QuerySQL puro directo a PostgreSQL
            const completedDate = new Date(orderData.orderDate.getTime() + 15 * 60000); // +15 mins

            // NOTA: Usamos interpolación directa (template strings) en vez de $1,$2 para evitar
            // colapsos silenciosos del driver `pg` de NodeJS al castear fechas Timestamp.
            await this.orderRepository.query(
              `UPDATE orders 
               SET order_date = '${orderData.orderDate.toISOString()}', 
                   order_status = '${orderData.orderStatus}', 
                   cook_id = ${orderData.cookId}, 
                   preparation_start_date = '${orderData.orderDate.toISOString()}', 
                   completed_date = '${completedDate.toISOString()}' 
               WHERE id_order = ${createdOrder.idOrder}`,
            );
          } catch (error) {
            this.logger.error(
              `Error inserting historical order for ${dataRecord.month}: ${error.message}`,
            );
          }
        }

        // C. Restaurar el estado original (CLOSED) y totales de la sesión
        await this.sessionRepository
          .createQueryBuilder()
          .update(CashierSession)
          .set({
            status: originalStatus as any,
            totalCash: dataRecord.session.totalCash,
            totalQr: dataRecord.session.totalQr,
            totalSales: dataRecord.session.totalSales,
            orderCount: dataRecord.session.orderCount,
            closingCashAmount: dataRecord.session.closingCashAmount,
            closingQrAmount: dataRecord.session.closingQrAmount,
            difference: dataRecord.session.difference,
          })
          .where('idSession = :id', { id: createdSession.idSession })
          .execute();
      }
    }

    this.logger.log('Historical Data seeding completed.');
  }
}
