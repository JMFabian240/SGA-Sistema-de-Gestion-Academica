import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Tutores Module (Functional)', () => {
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

  describe('RF-1: Catálogo de Tutores y Validaciones Fiscales', () => {
    it('debería crear, actualizar, listar y borrar lógicamente un tutor', async () => {
      // 1. Crear tutor sin datos fiscales
      const tutor = await caller.tutores.create({
        nombreCompleto: 'Guillermo del Toro',
        correoElectronico: 'guillermo@toro.com',
        telefono: '3339998888',
        requiereFactura: false
      });
      expect(tutor.tutorId).toBeDefined();
      expect(tutor.nombreCompleto).toBe('Guillermo del Toro');

      // 2. Intentar crear con requiereFactura: true pero sin datos fiscales (debería lanzar BAD_REQUEST)
      await expect(caller.tutores.create({
        nombreCompleto: 'Tutor Exigente',
        requiereFactura: true
      })).rejects.toThrowError(/Se requieren los datos fiscales si se solicita factura/);

      // 3. Crear con requiereFactura: true y datos fiscales
      const tutorFiscal = await caller.tutores.create({
        nombreCompleto: 'Alejandro G. Iñarritu',
        requiereFactura: true,
        datosFiscales: {
          rfc: 'GINA700101XYZ',
          razonSocial: 'Alejandro G. Iñarritu S.C.',
          regimenFiscal: '601',
          usoCfdi: 'G03',
          correoFacturacion: 'facturas@inarritu.com'
        }
      });
      expect(tutorFiscal.tutorId).toBeDefined();
      expect(tutorFiscal.datosFiscales).not.toBeNull();
      expect(tutorFiscal.datosFiscales.rfc).toBe('GINA700101XYZ');

      // 4. Listar tutores activos (ordenados alfabéticamente)
      const list = await caller.tutores.getAll();
      expect(list.length).toBe(2);
      expect(list[0].nombreCompleto).toBe('Alejandro G. Iñarritu');
      expect(list[1].nombreCompleto).toBe('Guillermo del Toro');

      // 5. Obtener detalle de tutor por ID
      const detail = await caller.tutores.getById(tutorFiscal.tutorId);
      expect(detail.tutorId).toBe(tutorFiscal.tutorId);
      expect(detail.datosFiscales.razonSocial).toBe('Alejandro G. Iñarritu S.C.');

      // 6. Intentar actualizar a requiereFactura: true en tutor sin datos fiscales (debería lanzar BAD_REQUEST)
      await expect(caller.tutores.update({
        tutorId: tutor.tutorId,
        requiereFactura: true
      })).rejects.toThrowError(/Faltan los datos fiscales para habilitar la facturación/);

      // 7. Actualizar exitosamente agregando datos fiscales
      const updated = await caller.tutores.update({
        tutorId: tutor.tutorId,
        requiereFactura: true,
        datosFiscales: {
          rfc: 'DTOR600101ABC',
          razonSocial: 'Guillermo del Toro Films',
          correoFacturacion: 'facturacion@del-toro.com'
        }
      });
      expect(updated.requiereFactura).toBe(true);
      expect(updated.datosFiscales.rfc).toBe('DTOR600101ABC');

      // 8. Soft Delete de tutor
      const deleted = await caller.tutores.delete(tutorFiscal.tutorId);
      expect(deleted.eliminadoEn).not.toBeNull();
      expect(deleted.activo).toBe(false);

      // Obtener detalles del eliminado debería arrojar NOT_FOUND
      await expect(caller.tutores.getById(tutorFiscal.tutorId)).rejects.toThrowError(/Tutor no encontrado/);
    });
  });

  describe('RF-2: Regla de Negocio sobre Saldo a Favor', () => {
    it('debería prohibir la eliminación si el tutor tiene saldo a favor activo', async () => {
      // Crear tutor con saldo a favor
      const tutorConSaldo = await prisma.tutor.create({
        data: {
          tutorId: 3,
          nombreCompleto: 'Tutor Ahorrador',
          saldoAFavor: 500.00 // Saldo a favor positivo
        }
      });

      // Intentar eliminar (debería fallar por saldo a favor activo)
      await expect(caller.tutores.delete(tutorConSaldo.tutorId)).rejects.toThrowError(
        /No se puede eliminar un tutor con saldo a favor activo/
      );

      // Verificar en BD que sigue activo
      const dbTutor = await prisma.tutor.findUnique({ where: { tutorId: tutorConSaldo.tutorId } });
      expect(dbTutor?.eliminadoEn).toBeNull();
      expect(dbTutor?.activo).toBe(true);

      // Vaciar saldo a favor
      await prisma.tutor.update({
        where: { tutorId: tutorConSaldo.tutorId },
        data: { saldoAFavor: 0 }
      });

      // Intentar eliminar ahora (debería tener éxito)
      const deleted = await caller.tutores.delete(tutorConSaldo.tutorId);
      expect(deleted.eliminadoEn).not.toBeNull();
      expect(deleted.activo).toBe(false);
    });
  });
});
