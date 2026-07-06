import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Reportes Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;
  let studentMock: any;
  let cycleMock: any;
  let levelMock: any;
  let tutorMock: any;

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

    tutorMock = await prisma.tutor.create({
      data: {
        tutorId: 1,
        nombreCompleto: 'Juan Perez Padre',
        correoElectronico: 'juan.perez@tutor.com',
        telefono: '5551234567',
        saldoAFavor: 0
      }
    });

    // Vincular como tutor principal
    await prisma.tutorAlumno.create({
      data: {
        tutorId: tutorMock.tutorId,
        alumnoId: studentMock.alumnoId,
        parentesco: 'Padre',
        esPrincipal: true
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

  describe('RF-1: Reporte de Deudores', () => {
    it('debería retornar listado de deudores vencidos con días de atraso correctos', async () => {
      // 1. Crear adeudo vencido
      // Colocar fecha de vencimiento hace 10 días
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      await prisma.calendarioPago.create({
        data: {
          alumnoId: studentMock.alumnoId,
          cicloId: cycleMock.cicloId,
          concepto: 'Colegiatura Sep',
          fechaVencimiento: tenDaysAgo,
          montoOriginal: 3000,
          saldoPendiente: 3000,
          estadoCobro: 'VENCIDO'
        }
      });

      // Crear otro adeudo que NO está vencido (debería ser omitido)
      await prisma.calendarioPago.create({
        data: {
          alumnoId: studentMock.alumnoId,
          cicloId: cycleMock.cicloId,
          concepto: 'Colegiatura Oct',
          fechaVencimiento: new Date(),
          montoOriginal: 3000,
          saldoPendiente: 3000,
          estadoCobro: 'PENDIENTE'
        }
      });

      // Obtener reporte
      const report = await caller.reportes.reporteDeudores();
      expect(report.length).toBe(1);
      expect(report[0].alumno).toBe('Juan Perez Lopez');
      expect(report[0].tutorPrincipal).toBe('Juan Perez Padre');
      expect(report[0].montoAdeudo).toBe(3000);
      expect(report[0].diasAtraso).toBe(10);
    });
  });

  describe('RF-2: Reporte de Ingresos', () => {
    it('debería retornar los pagos recibidos dentro del rango de fechas', async () => {
      // 1. Crear pago dentro del rango
      const targetDate = new Date('2026-09-15T12:00:00.000Z');
      await prisma.pago.create({
        data: {
          alumnoId: studentMock.alumnoId,
          tutorId: tutorMock.tutorId,
          fechaPago: targetDate,
          montoTotal: 3400,
          metodoPago: 'DEPOSITO',
          registradoPor: adminActor.usuarioId
        }
      });

      // 2. Crear pago fuera del rango (después)
      await prisma.pago.create({
        data: {
          alumnoId: studentMock.alumnoId,
          tutorId: tutorMock.tutorId,
          fechaPago: new Date('2026-10-15T12:00:00.000Z'),
          montoTotal: 3000,
          metodoPago: 'DEPOSITO',
          registradoPor: adminActor.usuarioId
        }
      });

      // Obtener reporte para el mes de Septiembre
      const report = await caller.reportes.reporteIngresos({
        fechaInicio: new Date('2026-09-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2026-09-30T23:59:59.000Z').toISOString()
      });

      expect(report.length).toBe(1);
      expect(report[0].montoTotal).toBe(3400);
      expect(report[0].tutor).toBe('Juan Perez Padre');
      expect(report[0].cajero).toBe('Actor Administrador');
    });
  });

  describe('RF-3: Lista de Asistencia', () => {
    it('debería retornar la lista de alumnos activos y sus asistencias filtradas', async () => {
      // Crear grupo, materia y grupo-materia
      const group = await prisma.grupo.create({
        data: {
          nivelId: levelMock.nivelId,
          cicloId: cycleMock.cicloId,
          nombre: '1º A',
          cupoMaximo: 30
        }
      });

      const subject = await prisma.materia.create({
        data: { nombre: 'Historia', clave: 'HIS-101' }
      });

      const groupSubject = await prisma.grupoMateria.create({
        data: {
          grupoId: group.grupoId,
          materiaId: subject.materiaId
        }
      });

      // Crear inscripción ACTIVA del estudiante en el grupo
      const plan = await prisma.planPago.create({
        data: { nombre: 'A', meses: 10, montoMensual: 1000 }
      });

      await prisma.inscripcionCiclo.create({
        data: {
          alumnoId: studentMock.alumnoId,
          cicloId: cycleMock.cicloId,
          grupoId: group.grupoId,
          planPagoId: plan.planPagoId,
          fechaIngreso: new Date(),
          estadoEnCiclo: 'ACTIVO',
          estadoFinanciero: 'AL_CORRIENTE'
        }
      });

      // Crear una asistencia en Septiembre de 2026
      const attendanceDate = new Date(2026, 8, 15); // Septiembre es mes 8 (0-indexed)
      await prisma.asistencia.create({
        data: {
          alumnoId: studentMock.alumnoId,
          grupoMateriaId: groupSubject.grupoMateriaId,
          fecha: attendanceDate,
          estado: 'PRESENTE',
          registradaPor: adminActor.usuarioId
        }
      });

      // Obtener lista de asistencia filtrada para Septiembre de 2026
      const attendanceList = await caller.reportes.listaAsistencia({
        grupoId: group.grupoId,
        mes: 9,
        anio: 2026
      });

      expect(attendanceList.totalAlumnos).toBe(1);
      expect(attendanceList.alumnos).toContain('Juan Perez Lopez');
      expect(attendanceList.registroDetallado.length).toBe(1);
      expect(attendanceList.registroDetallado[0].estado).toBe('PRESENTE');

      // Buscar para un mes diferente (Octubre de 2026) -> Debería retornar asistencias vacías
      const emptyList = await caller.reportes.listaAsistencia({
        grupoId: group.grupoId,
        mes: 10,
        anio: 2026
      });
      expect(emptyList.totalAlumnos).toBe(1);
      expect(emptyList.registroDetallado.length).toBe(0);
    });
  });
});
