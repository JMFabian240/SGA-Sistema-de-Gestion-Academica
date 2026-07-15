import { describe, it, expect } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import bcrypt from 'bcryptjs';

describe('Auth Router (Integration)', () => {
  it('debería rechazar si faltan campos (Zod validation)', async () => {
    const ctx = {
      req: { headers: {} } as any,
      res: {} as any,
      prisma: prisma,
      token: null
    };

    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.login({ identificador: '', contrasena: '123' }))
      .rejects.toThrowError(/El nombre de usuario debe tener al menos 3 caracteres/);
  });

  it('debería retornar un token válido si las credenciales son correctas', async () => {
    // 1. Arrange: Preparar la BD insertando un usuario y su contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('ContrasenaSegura123!', salt);
    
    const uniqueUser = `admin_test_${Date.now()}`;

    await prisma.usuario.create({
      data: {
        nombreUsuario: uniqueUser,
        nombreCompleto: 'Admin Test',
        passwordHash: hash,
        activo: true
      }
    });

    // 2. Act: Llamar al router como si fuera un cliente
    const ctx = {
      req: { headers: {} } as any,
      res: {} as any,
      prisma: prisma,
      token: null
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      identificador: uniqueUser,
      contrasena: 'ContrasenaSegura123!'
    });

    // 3. Assert
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });
});
