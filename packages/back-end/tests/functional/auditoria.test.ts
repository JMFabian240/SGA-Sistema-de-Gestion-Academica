import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Auditoria Module (Functional)', () => {
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

  describe('RF-1: Obtener y Filtrar Logs de Auditoría', () => {
    it('debería retornar logs paginados y filtrados correctamente', async () => {
      // Crear logs mockeados de auditoría directamente en la BD
      // Usamos BigInt de forma explícita
      await prisma.logAuditoria.createMany({
        data: [
          {
            logId: 100n,
            usuarioId: adminActor.usuarioId,
            accion: 'CREATE',
            tablaAfectada: 'alumno',
            registroId: '1',
            direccionIp: '127.0.0.1',
            descripcion: 'Crear alumno mock',
            fechaHora: new Date('2026-09-10T10:00:00.000Z')
          },
          {
            logId: 101n,
            usuarioId: adminActor.usuarioId,
            accion: 'UPDATE',
            tablaAfectada: 'alumno',
            registroId: '1',
            direccionIp: '127.0.0.1',
            descripcion: 'Actualizar alumno mock',
            fechaHora: new Date('2026-09-10T10:05:00.000Z')
          },
          {
            logId: 102n,
            usuarioId: adminActor.usuarioId,
            accion: 'DELETE',
            tablaAfectada: 'usuario',
            registroId: '2',
            direccionIp: '127.0.0.1',
            descripcion: 'Desactivar usuario mock',
            fechaHora: new Date('2026-09-11T12:00:00.000Z')
          }
        ]
      });

      // 1. Obtener logs paginados sin filtros
      // Debería venir ordenado por fecha descendente (102, 101, 100)
      const listPaginated = await caller.auditoria.obtenerLogs({
        pagina: 1,
        limite: 2
      });

      expect(listPaginated.meta.total).toBe(3);
      expect(listPaginated.meta.totalPaginas).toBe(2);
      expect(listPaginated.data.length).toBe(2);
      // El primero debe ser el del 11 de Septiembre (logId: "102")
      expect(listPaginated.data[0].logId).toBe("102");
      expect(listPaginated.data[0].usuario.nombreCompleto).toBe("Actor Administrador");

      // 2. Filtrar por tablaAfectada "alumno" y accion "UPDATE"
      const listFiltered = await caller.auditoria.obtenerLogs({
        tablaAfectada: 'alumno',
        accion: 'UPDATE',
        pagina: 1,
        limite: 10
      });
      expect(listFiltered.meta.total).toBe(1);
      expect(listFiltered.data[0].logId).toBe("101");
      expect(listFiltered.data[0].accion).toBe("UPDATE");

      // 3. Filtrar por rango de fecha
      const listDateFiltered = await caller.auditoria.obtenerLogs({
        fechaInicio: new Date('2026-09-10T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2026-09-10T23:59:59.000Z').toISOString(),
        pagina: 1,
        limite: 10
      });
      expect(listDateFiltered.meta.total).toBe(2); // Sólo los del 10 de Septiembre
      expect(listDateFiltered.data[0].logId).toBe("101");
      expect(listDateFiltered.data[1].logId).toBe("100");
    });
  });
});
