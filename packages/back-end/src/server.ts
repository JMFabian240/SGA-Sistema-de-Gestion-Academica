import fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './router';
import { createContext } from './context';
import multipart from '@fastify/multipart';
import { importacionesController } from './modules/importaciones/importaciones.controller';
export function buildServer() {
  const server = fastify({
    logger: true,
    bodyLimit: 15 * 1024 * 1024 // 15MB
  });

  server.register(cors, {
    origin: true, // Permitir cualquier origen en desarrollo
    credentials: true,
  });

  server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  server.get('/', async () => {
    return { status: 'SGA API is running' };
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  server.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB
    }
  });

  server.register(importacionesController, { prefix: '/api/importaciones' });

  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);
    reply.status(500).send({ ok: false, message: error.message, stack: error.stack });
  });

  return server;
}
