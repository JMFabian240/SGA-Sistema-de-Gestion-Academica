import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Configuracion Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;

  beforeEach(async () => {
    // 1. Crear catálogo de roles requeridos
    const adminRol = await prisma.rol.create({
      data: {
        rolId: 1,
        codigo: 'ADMIN',
        nombre: 'ADMIN',
        descripcion: 'Administrador'
      }
    });

    // 2. Crear usuario administrador (actor)
    adminActor = await prisma.usuario.create({
      data: {
        usuarioId: 1,
        nombreUsuario: 'actor_admin',
        nombreCompleto: 'Actor Administrador',
        correo: 'actor@sga.com',
        passwordHash: 'dummy_hash',
        activo: true
      }
    });

    await prisma.usuarioRol.create({
      data: {
        usuarioId: adminActor.usuarioId,
        rolId: adminRol.rolId,
        asignadoPor: adminActor.usuarioId
      }
    });

    // Generar token JWT firmado
    validToken = jwt.sign(
      { usuarioId: adminActor.usuarioId, jti: 'test-jti-uuid' },
      process.env.JWT_SECRET || 'supersecret'
    );

    const ctx = {
      req: { headers: {}, ip: '127.0.0.1' } as any,
      res: {} as any,
      prisma,
      token: validToken
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('RF-1: Obtener Configuración Global', () => {
    it('debería inicializar automáticamente con valores por defecto si no existe configuración', async () => {
      // Verificar que no haya configuración inicialmente
      const count = await prisma.configuracionGlobal.count();
      expect(count).toBe(0);

      // Obtener configuración (debería disparar la creación por defecto)
      const config = await caller.configuracion.get();
      expect(config.configuracionId).toBe(1);
      expect(config.montoRecargoDefecto).toBe(400);
      expect(config.diasGraciaRecargo).toBe(5);
      expect(config.plazoInscripcionDias).toBe(60);
      expect(config.umbralesSmtpDias).toEqual([5, 3, 1]);

      // Verificar en BD que ahora existe exactamente 1 registro
      const countAfter = await prisma.configuracionGlobal.count();
      expect(countAfter).toBe(1);
    });

    it('debería retornar el registro único existente en llamadas subsiguientes', async () => {
      // Crear manualmente un registro
      await prisma.configuracionGlobal.create({
        data: {
          configuracionId: 1,
          montoRecargoDefecto: 500,
          diasGraciaRecargo: 10,
          plazoInscripcionDias: 30,
          umbralesSmtpDias: [7, 3]
        }
      });

      // Llamar al endpoint
      const config = await caller.configuracion.get();
      expect(config.configuracionId).toBe(1);
      expect(config.montoRecargoDefecto).toBe(500);
      expect(config.diasGraciaRecargo).toBe(10);
      expect(config.plazoInscripcionDias).toBe(30);
      expect(config.umbralesSmtpDias).toEqual([7, 3]);

      // Verificar que siga habiendo solo 1 registro
      const count = await prisma.configuracionGlobal.count();
      expect(count).toBe(1);
    });
  });

  describe('RF-2: Actualizar Configuración Global', () => {
    it('debería actualizar de forma parcial e incondicional el registro único', async () => {
      // 1. Obtener para asegurar que exista inicialmente
      await caller.configuracion.get();

      // 2. Hacer actualización parcial
      const updated = await caller.configuracion.update({
        montoRecargoDefecto: 350.50,
        diasGraciaRecargo: 3
      });

      expect(updated.configuracionId).toBe(1);
      expect(updated.montoRecargoDefecto).toBe(350.5);
      expect(updated.diasGraciaRecargo).toBe(3);
      expect(updated.plazoInscripcionDias).toBe(60); // Se mantiene el default
      expect(updated.umbralesSmtpDias).toEqual([5, 3, 1]); // Se mantiene el default
      expect(updated.actualizadoEn).not.toBeNull();

      // Verificar en BD
      const dbConfig = await prisma.configuracionGlobal.findUnique({
        where: { configuracionId: 1 }
      });
      expect(Number(dbConfig?.montoRecargoDefecto)).toBe(350.5);
      expect(dbConfig?.diasGraciaRecargo).toBe(3);
    });

    it('debería rechazar valores negativos o no permitidos', async () => {
      // 1. Monto negativo
      await expect(caller.configuracion.update({
        montoRecargoDefecto: -100
      })).rejects.toThrowError(/El monto del recargo no puede ser negativo/);

      // 2. Días de gracia negativos
      await expect(caller.configuracion.update({
        diasGraciaRecargo: -5
      })).rejects.toThrowError(/Los días de gracia no pueden ser negativos/);

      // 3. Plazo de inscripción menor a 1 día
      await expect(caller.configuracion.update({
        plazoInscripcionDias: 0
      })).rejects.toThrowError(/El plazo de inscripción debe ser al menos 1 día/);

      // 4. Exceder límite de umbrales SMTP
      await expect(caller.configuracion.update({
        umbralesSmtpDias: [5, 4, 3, 2, 1, 0] // 6 elementos
      })).rejects.toThrowError(/Máximo 5 umbrales permitidos/);
    });
  });
});
