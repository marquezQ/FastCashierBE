import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// Modules
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CashierSessionsModule } from './cashier-sessions/cashier-sessions.module';
import { OrdersModule } from './orders/orders.module';
import { OrderDetailsModule } from './order-details/order-details.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DatabaseSeedsModule } from './database/seeds/seeds.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        // synchronize: true (SOLO DESARROLLO)
        synchronize: process.env.NODE_ENV !== 'production', // TypeORM no modificará tablas en producción
        dropSchema: process.env.DB_DROP_SCHEMA === 'true', // Permite resetear la BD con un comando
        extra: {
          options: '-c timezone=America/La_Paz',
        },
      }),
    }),
    DatabaseSeedsModule, // Registro de seeders
    UsersModule,
    AuthModule,
    RolesModule,
    CategoriesModule,
    ProductsModule,
    CashierSessionsModule,
    OrdersModule,
    OrderDetailsModule,
    CloudinaryModule,
  ],
})
export class AppModule { }
