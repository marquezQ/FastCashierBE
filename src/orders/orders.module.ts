import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { CashierSessionsModule } from '../cashier-sessions/cashier-sessions.module';
import { OrderDetailsModule } from '../order-details/order-details.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CashierSessionsModule,
    OrderDetailsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
