import { describe, it, expect, beforeEach } from 'vitest';
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

    await expect(caller.auth.login({ correo: 'test', contrasena: '' }))
      .rejects.toThrowError(/Debe ser un correo electrónico válido/);
  });

  it('debería retornar un token válido si las credenciales son correctas', async () => {
    // 1. Arrange: Preparar la BD insertando un usuario y su contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('ContrasenaSegura123!', salt);
    
    await prisma.usuario.create({
      data: {
        nombreUsuario: 'admin_test',
        nombreCompleto: 'Admin Test',
        correo: 'admin@test.com',
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
      correo: 'admin@test.com',
      contrasena: 'ContrasenaSegura123!'
    });

    // 3. Assert
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });
});
