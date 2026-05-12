import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/entities/order.entity';
import { CashierSession } from '../cashier-sessions/entities/cashier-session.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, CashierSession, Product, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
