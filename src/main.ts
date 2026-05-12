import { NestFactory } from '@nestjs/core';
process.env.TZ = 'America/La_Paz';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Orquestador de Seeders Senior
import { MasterSeederService } from './database/seeds/master-seeder.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración global de pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve campos no definidos en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían campos no definidos
      transform: true, // Transforma los payloads a instancias de DTOs
    }),
  );

  // Configuración global de CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API FastCashier')
    .setDescription('API documentation for FastCashier Project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Set global prefix
  app.setGlobalPrefix('api'); // Esto hará que todas tus rutas empiecen con /api (ej. http://localhost:3000/api/users)

  // Ejecutar sembrado de datos
  // Protección de Producción: Nunca ejecutar seeders en entorno de producción.
  // Protección de Ejecución: Solo ejecutar cuando se reinicia la BD explícitamente (db:fresh).
  if (process.env.NODE_ENV !== 'production' && process.env.DB_DROP_SCHEMA === 'true') {
    try {
      console.log('--- Iniciando Seeders Master (Desarrollo) ---');
      const masterSeeder = app.get(MasterSeederService);
      await masterSeeder.runAll();
      console.log('--- Seeders completados exitosamente ---');
    } catch (error) {
      console.error('Error al ejecutar los seeders:', error);
    }
  }

  // Iniciar servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicación corriendo en el puerto: ${port}`);
  console.log(`Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
