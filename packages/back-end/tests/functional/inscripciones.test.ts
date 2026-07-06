import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Inscripciones Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;
  let studentMock: any;
  let cycleMock: any;
  let levelMock: any;
  let becaMock: any;

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

    // 3. Crear datos base
    levelMock = await prisma.nivelEducativo.create({
      data: {
        nivelId: 1,
        codigo: 'SEC',
        nombre: 'Secundaria',
        orden: 1
      }
    });

    studentMock = await prisma.alumno.create({
      data: {
        alumnoId: 1,
        nombreCompleto: 'Juan Perez Lopez',
        matricula: 'MAT-2026-0001',
        fechaNacimiento: new Date('2010-01-01'),
        curp: 'PELJ100101HDFRRN01',
        sexo: 'M',
        tipoSangre: 'O+',
        estado: 'ACTIVO',
        nivelId: levelMock.nivelId
      }
    });

    cycleMock = await prisma.cicloEscolar.create({
      data: {
        cicloId: 1,
        nombre: '2026-2027',
        fechaInicio: new Date('2026-08-01'),
        fechaFin: new Date('2027-06-30'),
        activo: true
      }
    });

    becaMock = await prisma.beca.create({
      data: {
        becaId: 1,
        nombreBeca: 'Beca de Excelencia',
        criterio: 'ACADEMICA',
        porcentaje: 50
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

  describe('RF-1: Planes de Pago', () => {
    it('debería crear, actualizar, listar y eliminar (Soft Delete) planes de pago', async () => {
      // 1. Crear Plan de Pago
      const plan = await caller.inscripciones.createPlanPago({
        nombre: 'Plan Semestral',
        meses: 6,
        montoMensual: 1500,
        montoDiciembre: 0,
        descripcion: 'Pago cada semestre',
        activo: true
      });
      expect(plan.planPagoId).toBeDefined();
      expect(Number(plan.montoMensual)).toBe(1500);

      // 2. Listar Planes de Pago
      const list = await caller.inscripciones.getPlanesPago();
      expect(list.length).toBe(1);
      expect(list[0].nombre).toBe('Plan Semestral');

      // 3. Actualizar Plan
      const updated = await caller.inscripciones.updatePlanPago({
        planPagoId: plan.planPagoId,
        montoMensual: 1600
      });
      expect(Number(updated.montoMensual)).toBe(1600);

      // 4. Eliminar Plan (Soft Delete)
      const deleted = await caller.inscripciones.deletePlanPago(plan.planPagoId);
      expect(deleted.eliminadoEn).not.toBeNull();
      expect(deleted.activo).toBe(false);

      const listAfter = await caller.inscripciones.getPlanesPago();
      expect(listAfter.length).toBe(0); // Filtrado de eliminados
    });
  });

  describe('RF-2: Ventanas de Inscripción Temprana', () => {
    it('debería crear, actualizar, listar y eliminar (Soft Delete) ventanas de inscripción', async () => {
      // 1. Crear Ventana
      const ventana = await caller.inscripciones.createVentana({
        cicloId: cycleMock.cicloId,
        becaId: becaMock.becaId,
        fechaInicio: new Date('2026-05-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2026-05-31T00:00:00.000Z').toISOString(),
        activa: true
      });
      expect(ventana.ventanaId).toBeDefined();
      expect(ventana.activa).toBe(true);

      // 2. Listar Ventanas
      const list = await caller.inscripciones.getVentanas();
      expect(list.length).toBe(1);
      expect(list[0].ventanaId).toBe(ventana.ventanaId);
      expect(list[0].beca.nombreBeca).toBe('Beca de Excelencia');

      // 3. Actualizar Ventana
      const updated = await caller.inscripciones.updateVentana({
        ventanaId: ventana.ventanaId,
        activa: false
      });
      expect(updated.activa).toBe(false);

      // 4. Eliminar Ventana (Soft Delete)
      const deleted = await caller.inscripciones.deleteVentana(ventana.ventanaId);
      expect(deleted.eliminadoEn).not.toBeNull();
      expect(deleted.activa).toBe(false);

      const listAfter = await caller.inscripciones.getVentanas();
      expect(listAfter.length).toBe(0);
    });
  });

  describe('RF-3: Inscripciones de Alumnos y Exclusividad de Ciclo', () => {
    it('debería inscribir un alumno y rechazar inscripciones duplicadas para el mismo ciclo', async () => {
      // Crear plan de pago
      const plan = await prisma.planPago.create({
        data: {
          planPagoId: 1,
          nombre: 'Mensual Regular',
          meses: 10,
          montoMensual: 2000
        }
      });

      // Crear grupo
      const grupo = await prisma.grupo.create({
        data: {
          grupoId: 1,
          nivelId: levelMock.nivelId,
          cicloId: cycleMock.cicloId,
          nombre: '1º A',
          cupoMaximo: 30
        }
      });

      // 1. Inscribir Alumno
      const inscripcion = await caller.inscripciones.createInscripcion({
        alumnoId: studentMock.alumnoId,
        cicloId: cycleMock.cicloId,
        planPagoId: plan.planPagoId,
        grupoId: grupo.grupoId,
        fechaIngreso: new Date().toISOString(),
        estadoEnCiclo: 'INSCRITO',
        estadoFinanciero: 'AL_CORRIENTE'
      });
      expect(inscripcion.inscripcionId).toBeDefined();
      expect(inscripcion.alumnoId).toBe(studentMock.alumnoId);

      // Verificar en listado de inscripciones
      const list = await caller.inscripciones.getInscripciones({ cicloId: cycleMock.cicloId });
      expect(list.length).toBe(1);
      expect(list[0].inscripcionId).toBe(inscripcion.inscripcionId);

      // 2. Intentar duplicar inscripción (debería lanzar BAD_REQUEST)
      await expect(caller.inscripciones.createInscripcion({
        alumnoId: studentMock.alumnoId,
        cicloId: cycleMock.cicloId,
        planPagoId: plan.planPagoId,
        fechaIngreso: new Date().toISOString(),
        estadoEnCiclo: 'INSCRITO',
        estadoFinanciero: 'AL_CORRIENTE'
      })).rejects.toThrowError(/El alumno ya se encuentra inscrito en este ciclo escolar/);
    });
  });

  describe('RF-4: Gestión y Anulación de Inscripción', () => {
    it('debería actualizar campos de inscripción y permitir su anulación (Soft Delete)', async () => {
      // Seed plan e inscripción inicial
      const plan = await prisma.planPago.create({
        data: { planPagoId: 1, nombre: 'A', meses: 10, montoMensual: 1000 }
      });
      const inscripcion = await prisma.inscripcionCiclo.create({
        data: {
          inscripcionId: 1,
          alumnoId: studentMock.alumnoId,
          cicloId: cycleMock.cicloId,
          planPagoId: plan.planPagoId,
          fechaIngreso: new Date(),
          estadoEnCiclo: 'INSCRITO',
          estadoFinanciero: 'AL_CORRIENTE'
        }
      });

      // 1. Actualizar Inscripción (cambiar estado financiero)
      const updated = await caller.inscripciones.updateInscripcion({
        inscripcionId: inscripcion.inscripcionId,
        estadoFinanciero: 'MOROSO'
      });
      expect(updated.estadoFinanciero).toBe('MOROSO');

      // 2. Eliminar (Anular) Inscripción
      const deleted = await caller.inscripciones.deleteInscripcion(inscripcion.inscripcionId);
      expect(deleted.eliminadoEn).not.toBeNull();
      expect(deleted.estadoEnCiclo).toBe('ANULADA');

      // Listar no debería mostrarla
      const list = await caller.inscripciones.getInscripciones();
      expect(list.length).toBe(0);
    });
  });
});
