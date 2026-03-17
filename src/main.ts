import { NestFactory } from '@nestjs/core';
process.env.TZ = 'America/La_Paz';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { RolesService } from './roles/roles.service';
import { UsersService } from './users/users.service';
import { CategoriesService } from './categories/categories.service';
import { ProductsService } from './products/products.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activa Socket.io como motor de WebSockets.
  app.useWebSocketAdapter(new IoAdapter(app));

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

  // ============ SWAGGER CONFIGURATION ============
  const config = new DocumentBuilder()
    .setTitle('FastCashier API')
    .setDescription('API para sistema de punto de venta (POS)')
    .setVersion('1.0')
    .addTag('Authentication', 'Endpoints de autenticación y registro')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Roles', 'Gestión de roles')
    .addTag('Categories', 'Gestión de categorías de productos')
    .addTag('Products', 'Gestión de productos')
    .addTag('Orders', 'Gestión de órdenes/pedidos')
    .addTag('Cashier Sessions', 'Gestión de sesiones de caja')
    .addTag('Reports', 'Informes y estadísticas')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // Este es el nombre que usaremos en los controllers
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  console.log('📚 Swagger documentation available at: http://localhost:3000/api/docs');
  // ===============================================

  // EJECUTAR SEEDERS
  console.log('🌱 Starting database seeds...\n');

  try {
    // 1. ROLES (primero porque Users depende de ellos)
    console.log('📋 Seeding roles...');
    const rolesService = app.get(RolesService);
    await rolesService.seedDefaultRoles();
    console.log('✅ Roles seeded: ADMIN, CASHIER, KITCHEN\n');

    // 2. USUARIOS
    console.log('👥 Seeding users...');
    const usersService = app.get(UsersService);
    await usersService.seedDefaultUsers();
    console.log('✅ Users seeded:');
    console.log('   • admin@gmail.com / 123456 (Admin)');
    console.log('   • cashier@gmail.com / 123456 (Cashier)');
    console.log('   • cook@gmail.com / 123456 (Kitchen)\n');

    // 3. CATEGORÍAS (NUEVO - antes de productos)
    console.log('🏷️  Seeding categories...');
    const categoriesService = app.get(CategoriesService);
    await categoriesService.seedDefaultCategories();
    console.log('✅ Categories seeded: COMIDA, REFRESCOS, BEBIDAS CALIENTES, POSTRES\n');

    // 4. PRODUCTOS (después de categorías)
    console.log('🍔 Seeding products...');
    const productsService = app.get(ProductsService);
    await productsService.seedDefaultProducts();
    console.log('✅ Products seeded: 5 products created with categories\n');

    console.log('🎉 All seeds completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    console.error('Please check your database connection and try again.\n');
    // Opcional: Si falla, no iniciar el servidor
    // process.exit(1);
  }

  // Iniciar servidor
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  await app.listen(port);

  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 Server running on: http://localhost:${port}/api`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🔐 DEFAULT CREDENTIALS:\n');
  console.log('  👨‍💼 Admin:');
  console.log('     Email: admin@gmail.com');
  console.log('     Password: 123456\n');
  console.log('  💰 Cashier:');
  console.log('     Email: cashier@gmail.com');
  console.log('     Password: 123456\n');
  console.log('  👨‍🍳 Cook:');
  console.log('     Email: cook@gmail.com');
  console.log('     Password: 123456\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n📚 API Endpoints:');
  console.log('   • Categories: http://localhost:' + port + '/api/categories');
  console.log('   • Products: http://localhost:' + port + '/api/products');
  console.log('   • Users: http://localhost:' + port + '/api/users');
  console.log('═══════════════════════════════════════════════════\n');
}
void bootstrap();