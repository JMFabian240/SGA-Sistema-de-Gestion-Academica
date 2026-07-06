import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { prisma } from '@sga/data-access';
import { beforeEach, vi } from 'vitest';

// Creamos un mock profundo de PrismaClient
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Hacemos un mock del módulo data-access para que devuelva nuestro prismaMock
vi.mock('@sga/data-access', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
  
  // Mock por defecto de roles (ADMIN) para evitar que fallen los routers protegidos
  prismaMock.usuarioRol.findMany.mockResolvedValue([
    {
      usuarioRolId: 1,
      usuarioId: 99,
      rolId: 1,
      rol: {
        rolId: 1,
        codigo: 'ADMIN',
        nombre: 'Administrador'
      }
    }
  ] as any);
});
