import { describe, it, expect } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Configuracion Router (Integration)', () => {
  const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
  
  const ctx = {
    req: { headers: {} } as any,
    res: {} as any,
    prisma: prisma,
    token: validToken
  };

  it('debería auto-crear la configuración por defecto si la base de datos está vacía', async () => {
    const caller = appRouter.createCaller(ctx);

    // Act
    const configResult = await caller.configuracion.get();

    // Assert
    expect(configResult.configuracionId).toBe(1);
    expect(configResult.montoRecargoDefecto).toBe(400); // Valor por defecto
    expect(configResult.diasGraciaRecargo).toBe(5);
    expect(configResult.plazoInscripcionDias).toBe(60);
    expect(Array.isArray(configResult.umbralesSmtpDias)).toBe(true);
    expect(configResult.umbralesSmtpDias).toEqual([5, 3, 1]);

    // Verificar Persistencia
    const dbConfig = await prisma.configuracionGlobal.findUnique({
      where: { configuracionId: 1 }
    });
    
    expect(dbConfig).not.toBeNull();
    // Prisma devuelve el Decimal pero probamos la instancia
    expect(dbConfig?.montoRecargoDefecto.toNumber()).toBe(400);
  });

  it('debería actualizar la configuración correctamente procesando JSON y Decimal', async () => {
    const caller = appRouter.createCaller(ctx);

    // Forzamos que exista antes para probar el update (aunque get y update ya lo hacen interno)
    const updateInput = {
      montoRecargoDefecto: 550.50,
      diasGraciaRecargo: 3,
      umbralesSmtpDias: [7, 4, 2, 1]
    };

    const updatedConfig = await caller.configuracion.update(updateInput);

    expect(updatedConfig.montoRecargoDefecto).toBe(550.5);
    expect(updatedConfig.diasGraciaRecargo).toBe(3);
    expect(updatedConfig.umbralesSmtpDias).toEqual([7, 4, 2, 1]);
    expect(updatedConfig.plazoInscripcionDias).toBe(60); // Se mantuvo igual

    // Validar Persistencia Real
    const dbConfig = await prisma.configuracionGlobal.findUnique({
      where: { configuracionId: 1 }
    });

    expect(dbConfig?.montoRecargoDefecto.toNumber()).toBe(550.5);
    expect(dbConfig?.umbralesSmtpDias).toEqual([7, 4, 2, 1]);
  });

  it('debería rechazar si la validación de Zod falla (números negativos)', async () => {
    const caller = appRouter.createCaller(ctx);

    const invalidInput = {
      montoRecargoDefecto: -100 // Inválido
    };

    await expect(caller.configuracion.update(invalidInput))
      .rejects.toThrowError(/El monto del recargo no puede ser negativo|too_small/);
  });
});
