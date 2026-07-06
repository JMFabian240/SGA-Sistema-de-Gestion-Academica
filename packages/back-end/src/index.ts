import 'dotenv/config';
import { buildServer } from './server';

const server = buildServer();
const PORT = Number(process.env.PORT) || 3001;

async function start() {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
