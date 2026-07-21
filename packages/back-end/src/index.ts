import 'dotenv/config';
import { buildServer } from './server';
import { initCronRecargos } from './cron/recargos.cron';
import { execSync } from 'child_process';
import path from 'path';

const server = buildServer();
const PORT = Number(process.env.TRPC_PORT) || Number(process.env.PORT) || 3001;

async function start() {
  try {
    // Ejecutar migraciones si se solicita
    if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS === 'true') {
      console.log('Ejecutando migraciones de base de datos...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('Migraciones completadas correctamente.');
      } catch (migrationError) {
        console.error('Error ejecutando migraciones:', migrationError);
        process.exit(1);
      }
    }

    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    
    // Iniciar tareas programadas
    initCronRecargos();

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
