import { type CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { prisma } from '@sga/data-access';

export function createContext({ req, res }: CreateFastifyContextOptions) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || null;

  return {
    req,
    res,
    prisma,
    token
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
