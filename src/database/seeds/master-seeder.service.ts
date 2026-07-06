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
    // Lee el modo desde .env. Valores posibles:
    // - 'demo'       → Carga todo: usuarios ficticios, categorías, productos e historial.
    //                  Usar en la instancia de demostración.
    // - 'production' → Carga mínimo: solo 3 roles + 2 admins definidos en .env.
    //                  El dueño del negocio crea cajeros/cocineros/productos desde el panel.
    //                  Usar al inicializar un cliente real por primera vez.
    const seedMode = process.env.SEED_MODE || 'production';

    this.logger.log(`====== STARTING MASTER SEED [mode: ${seedMode}] ======`);

    try {
      // Paso 1: Roles — siempre (ADMIN, CASHIER, KITCHEN)
      await this.rolesSeeder.seed();

      // Paso 2: Usuarios — 2 admins del .env en 'production', usuarios ficticios en 'demo'
      await this.usersSeeder.seed(seedMode);

      // Paso 3: Categorías — siempre, en cualquier modo.
      // El panel de admin aún no permite crear categorías, así que se necesitan
      // las 4 por defecto para que el dueño pueda asignarlas a sus productos.
      await this.categoriesSeeder.seed();

      if (seedMode === 'demo') {
        // Solo en demo: productos con imágenes de ejemplo + historial de órdenes
        await this.productsSeeder.seed();
        await this.historySeeder.seed();
      }

      this.logger.log('====== MASTER SEED FINISHED SUCCESSFULLY ======');
    } catch (error) {
      this.logger.error('====== ERROR DURING MASTER SEED ======', error.stack);
      throw error;
    }
  }
}
