import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RolesService } from './roles/roles.service';
import { UsersService } from './users/users.service';
import { ProductsService } from './products/products.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors();

  // Prefijo global
  app.setGlobalPrefix('api');

  // EJECUTAR SEEDERS
  console.log('Starting database seeds...\n');

  try {
    //ROLES (primero porque Users depende de ellos)
    console.log('Seeding roles...');
    const rolesService = app.get(RolesService);
    await rolesService.seedDefaultRoles();
    console.log('Roles seeded: ADMIN, CASHIER, KITCHEN\n');

    //USUARIOS
    console.log('⏳ Seeding users...');
    const usersService = app.get(UsersService);
    await usersService.seedDefaultUsers();
    console.log('Users seeded:');
    console.log('admin@gmail.com / 123456 (Admin)');
    console.log('cashier@gmail.com / 123456 (Cashier)');
    console.log('cook@gmail.com / 123456 (Kitchen)\n');

    //PRODUCTOS
    console.log('Seeding products...');
    const productsService = app.get(ProductsService);
    await productsService.seedDefaultProducts();
    console.log('Products seeded: 4 products created\n');

    console.log('All seeds completed successfully!\n');
  } catch (error) {
    console.error('Error during seeding:', error);
    console.error('Please check your database connection and try again.\n');
  }

  // Iniciar servidor
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  await app.listen(port);

  console.log('═══════════════════════════════════════════════════');
  console.log(`Server running on: http://localhost:${port}/api`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\nDEFAULT CREDENTIALS:\n');
  console.log('  Admin:');
  console.log('    Email: admin@gmail.com');
  console.log('    Password: 123456\n');
  console.log('  Cashier:');
  console.log('    Email: cashier@gmail.com');
  console.log('    Password: 123456\n');
  console.log('  Cook:');
  console.log('    Email: cook@gmail.com');
  console.log('    Password: 123456\n');
  console.log('═══════════════════════════════════════════════════\n');
}
void bootstrap();
