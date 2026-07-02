import { beforeEach, afterAll, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

// Cargar .env.test forzando override para que no use el .env por defecto
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });

// Usar el cliente Prisma real (NO el mock)
import { prisma } from '@sga/data-access';

beforeAll(async () => {
  // Conectar a la base de datos de pruebas
  await prisma.$connect();
});

beforeEach(async () => {
  // Limpiar todas las tablas (TRUNCATE) garantizando un entorno aislado para cada test.
  // CASCADE asegura que las dependencias foráneas también se limpien.
  const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `;

  for (const { tablename } of tableNames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        console.error(`Error truncating table ${tablename}:`, error);
      }
    }
  }
});

afterAll(async () => {
  // Desconectar
  await prisma.$disconnect();
});
