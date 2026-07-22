import fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './router';
import { createContext } from './context';
import multipart from '@fastify/multipart';
import { importacionesController } from './modules/importaciones/importaciones.controller';
import fastifyStatic from '@fastify/static';
import path from 'path';

export function buildServer() {
  const server = fastify({
    logger: true,
    bodyLimit: 15 * 1024 * 1024 // 15MB
  });

  server.register(cors, {
    origin: true,
    credentials: true,
  });

  server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  const distPath = path.join(__dirname, '../../front-end/dist');
  server.register(fastifyStatic, {
    root: distPath,
    wildcard: false,
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  server.get('/*', async (request, reply) => {
    if (request.url.startsWith('/trpc') || request.url.startsWith('/api') || request.url === '/health') {
      reply.callNotFound();
      return;
    }
    return reply.sendFile('index.html');
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
