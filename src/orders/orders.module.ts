import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { CashierSessionsModule } from '../cashier-sessions/cashier-sessions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CashierSessionsModule, // Importar para usar CashierSessionsService
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
