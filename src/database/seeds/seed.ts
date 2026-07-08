/**
 * Script independiente de seed — NO levanta servidor HTTP.
 *
 * Usa NestFactory.createApplicationContext() para arrancar solo el
 * contexto de DI de NestJS sin abrir ningún puerto. Conecta a la BD,
 * ejecuta los seeders y termina el proceso limpiamente.
 *
 * Uso local (desarrollo):
 *   npm run db:seed                       ← usa SEED_MODE del .env
 *   SEED_MODE=demo npm run db:seed        ← override puntual sin editar .env
 *
 * Uso en VPS — primera inicialización de un cliente real:
 *   NODE_ENV=development DB_DROP_SCHEMA=true npm run db:seed
 *   (NODE_ENV=development activa synchronize:true en TypeORM para crear las tablas)
 *
 * El script db:fresh ya usa esto internamente:
 *   npm run db:fresh   ← equivalente a NODE_ENV=development DB_DROP_SCHEMA=true npm run db:seed
 */

// Carga el .env ANTES de cualquier import que lo necesite
import * as dotenv from 'dotenv';
dotenv.config();

// Zona horaria Bolivia, igual que en main.ts
process.env.TZ = 'America/La_Paz';

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { MasterSeederService } from './master-seeder.service';

const logger = new Logger('SeedScript');

async function runSeed() {
  logger.log('Iniciando contexto de aplicación (sin servidor HTTP)...');

  // createApplicationContext arranca el DI container de NestJS sin HTTP adapter.
  // TypeORM conecta a la BD según el .env. Ningún puerto queda abierto.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const masterSeeder = app.get(MasterSeederService);
    await masterSeeder.runAll();
    logger.log('✅ Seed completado exitosamente.');
  } catch (error) {
    logger.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    // Cierra la conexión a la BD y termina el proceso limpiamente
    await app.close();
    process.exit(0);
  }
}

void runSeed();
