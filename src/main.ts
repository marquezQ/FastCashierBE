import { NestFactory } from '@nestjs/core';
process.env.TZ = 'America/La_Paz';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Los seeders ya NO se ejecutan aquí.
// Usar: npm run db:seed  (script independiente, sin levantar servidor HTTP)

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
  app.setGlobalPrefix('api');

  // Iniciar servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicación corriendo en el puerto: ${port}`);
  console.log(`Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}

void bootstrap();
