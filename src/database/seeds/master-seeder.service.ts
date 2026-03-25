import { Injectable, Logger } from '@nestjs/common';
import { RolesSeederProvider } from './providers/roles-seeder.provider';
import { UsersSeederProvider } from './providers/users-seeder.provider';
import { CategoriesSeederProvider } from './providers/categories-seeder.provider';
import { ProductsSeederProvider } from './providers/products-seeder.provider';
import { HistorySeederProvider } from './providers/history-seeder.provider';

@Injectable()
export class MasterSeederService {
  private readonly logger = new Logger(MasterSeederService.name);

  constructor(
    private readonly rolesSeeder: RolesSeederProvider,
    private readonly usersSeeder: UsersSeederProvider,
    private readonly categoriesSeeder: CategoriesSeederProvider,
    private readonly productsSeeder: ProductsSeederProvider,
    private readonly historySeeder: HistorySeederProvider,
  ) {}

  async runAll(): Promise<void> {
    this.logger.log('====== STARTING SENIOR MASTER SEED ======');

    try {
      // Orden crítico de dependencias
      await this.rolesSeeder.seed();
      await this.usersSeeder.seed();
      await this.categoriesSeeder.seed();
      await this.productsSeeder.seed();

      // HISTORIA (Enero / Febrero)
      await this.historySeeder.seed();

      this.logger.log('====== MASTER SEED FINISHED SUCCESSFULLY ======');
    } catch (error) {
      this.logger.error('====== ERROR DURING MASTER SEED ======', error.stack);
      throw error;
    }
  }
}
