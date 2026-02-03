import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashierSessionsService } from './cashier-sessions.service';
import { CashierSessionsController } from './cashier-sessions.controller';
import { CashierSession } from './entities/cashier-session.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashierSession, Order])],
  controllers: [CashierSessionsController],
  providers: [CashierSessionsService],
  exports: [CashierSessionsService], // Para usar en otros módulos (ventas)
})
export class CashierSessionsModule { }
