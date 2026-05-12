import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades necesarias para los repositorios
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { CashierSession } from '../../cashier-sessions/entities/cashier-session.entity';
import { Order } from '../../orders/entities/order.entity';

// Orquestador y Proveedores
import { MasterSeederService } from './master-seeder.service';
import { RolesSeederProvider } from './providers/roles-seeder.provider';
import { UsersSeederProvider } from './providers/users-seeder.provider';
import { CategoriesSeederProvider } from './providers/categories-seeder.provider';
import { ProductsSeederProvider } from './providers/products-seeder.provider';
import { HistorySeederProvider } from './providers/history-seeder.provider';

// Modulos importados para acceder a sus servicios
import { CashierSessionsModule } from '../../cashier-sessions/cashier-sessions.module';
import { OrdersModule } from '../../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User, Category, Product, CashierSession, Order]),
    CashierSessionsModule,
    OrdersModule,
  ],
  providers: [
    MasterSeederService,
    RolesSeederProvider,
    UsersSeederProvider,
    CategoriesSeederProvider,
    ProductsSeederProvider,
    HistorySeederProvider,
  ],
  exports: [MasterSeederService],
})
export class DatabaseSeedsModule {}
