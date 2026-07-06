import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Dashboard Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;
  let levelMock: any;
  let cycleMock: any;

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

    // 3. Crear datos base académicos
    levelMock = await prisma.nivelEducativo.create({
      data: {
        nivelId: 1,
        codigo: 'SEC',
        nombre: 'Secundaria',
        orden: 1
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

  describe('RF-1: Métricas de Inscripción', () => {
    it('debería contar alumnos activos, de baja y sumar cupos de grupos por nivel', async () => {
      // 1. Crear alumnos con diferentes estados
      await prisma.alumno.createMany({
        data: [
          {
            alumnoId: 1,
            nombreCompleto: 'Juan Perez Lopez',
            matricula: 'MAT-2026-0001',
            fechaNacimiento: new Date('2010-01-01'),
            curp: 'PELJ100101HDFRRN01',
            sexo: 'M',
            estado: 'ACTIVO',
            nivelId: levelMock.nivelId
          },
          {
            alumnoId: 2,
            nombreCompleto: 'Maria Lopez Perez',
            matricula: 'MAT-2026-0002',
            fechaNacimiento: new Date('2011-02-02'),
            curp: 'LOPM110202MDFRRN01',
            sexo: 'F',
            estado: 'BAJA_TEMPORAL',
            nivelId: levelMock.nivelId
          },
          {
            alumnoId: 3,
            nombreCompleto: 'Carlos Helu Slim',
            matricula: 'MAT-2026-0003',
            fechaNacimiento: new Date('2009-03-03'),
            curp: 'HELJ090303HDFRRN01',
            sexo: 'M',
            estado: 'BAJA_DEFINITIVA',
            nivelId: levelMock.nivelId
          }
        ]
      });

      // 2. Crear grupos para sumar cupos
      await prisma.grupo.createMany({
        data: [
          {
            grupoId: 1,
            nivelId: levelMock.nivelId,
            cicloId: cycleMock.cicloId,
            nombre: '1º A',
            cupoMaximo: 25
          },
          {
            grupoId: 2,
            nivelId: levelMock.nivelId,
            cicloId: cycleMock.cicloId,
            nombre: '1º B',
            cupoMaximo: 30
          }
        ]
      });

      // Obtener métricas
      const metrics = await caller.dashboard.obtenerMetricasInscripcion();
      expect(metrics.alumnosActivos).toBe(1); // Solo alumnoId: 1
      expect(metrics.alumnosBaja).toBe(2); // Alumno 2 (temporal) + Alumno 3 (definitiva)
      expect(metrics.cuposTotales).toBe(55); // 25 + 30
      expect(metrics.detallesNivel.length).toBe(1);
      expect(metrics.detallesNivel[0].nivelId).toBe(levelMock.nivelId);
      expect(metrics.detallesNivel[0]._sum.cupoMaximo).toBe(55);
    });
  });

  describe('RF-2: KPIs Financieros', () => {
    it('debería calcular correctamente ingresos del mes actual y adeudos pendientes', async () => {
      // 1. Crear tutor y alumno requeridos para pagos
      const tutor = await prisma.tutor.create({
        data: {
          tutorId: 1,
          nombreCompleto: 'Juan Perez Padre'
        }
      });
      const alumno = await prisma.alumno.create({
        data: {
          alumnoId: 1,
          nombreCompleto: 'Alumno Pagador',
          curp: 'PAGA100101HDFRRN01',
          sexo: 'M',
          fechaNacimiento: new Date('2010-01-01'),
          estado: 'ACTIVO',
          nivelId: levelMock.nivelId
        }
      });

      // 2. Crear pagos
      // Pago 1: Mes actual (Fecha de hoy)
      await prisma.pago.create({
        data: {
          alumnoId: alumno.alumnoId,
          tutorId: tutor.tutorId,
          fechaPago: new Date(), // Hoy
          montoTotal: 3000.50,
          metodoPago: 'DEPOSITO',
          registradoPor: adminActor.usuarioId
        }
      });

      // Pago 2: Mes anterior
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      await prisma.pago.create({
        data: {
          alumnoId: alumno.alumnoId,
          tutorId: tutor.tutorId,
          fechaPago: lastMonth,
          montoTotal: 1500.00,
          metodoPago: 'DEPOSITO',
          registradoPor: adminActor.usuarioId
        }
      });

      // 3. Crear adeudos con diferentes estados
      await prisma.calendarioPago.createMany({
        data: [
          {
            calendarioPagoId: 1,
            alumnoId: alumno.alumnoId,
            cicloId: cycleMock.cicloId,
            concepto: 'Colegiatura Sep',
            fechaVencimiento: new Date(),
            montoOriginal: 2000,
            saldoPendiente: 2000,
            estadoCobro: 'PENDIENTE'
          },
          {
            calendarioPagoId: 2,
            alumnoId: alumno.alumnoId,
            cicloId: cycleMock.cicloId,
            concepto: 'Colegiatura Oct',
            fechaVencimiento: new Date(),
            montoOriginal: 2000,
            saldoPendiente: 500,
            estadoCobro: 'VENCIDO'
          },
          {
            calendarioPagoId: 3,
            alumnoId: alumno.alumnoId,
            cicloId: cycleMock.cicloId,
            concepto: 'Inscripción',
            fechaVencimiento: new Date(),
            montoOriginal: 2500,
            saldoPendiente: 0,
            estadoCobro: 'PAGADO'
          }
        ]
      });

      // Obtener KPIs Financieros
      const kpis = await caller.dashboard.obtenerKpisFinancieros();
      expect(Number(kpis.ingresosMesActual)).toBe(3000.5); // Solo pago del mes actual
      expect(Number(kpis.deudaPendienteTotal)).toBe(2500); // 2000 (PENDIENTE) + 500 (VENCIDO)
    });
  });
});
