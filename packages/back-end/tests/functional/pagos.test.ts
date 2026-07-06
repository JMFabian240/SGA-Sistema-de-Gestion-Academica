import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Pagos Module (Functional)', () => {
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

  describe('RF-1: Tarifas', () => {
    it('debería crear, actualizar, listar y eliminar (Soft Delete) tarifas', async () => {
      // 1. Crear Tarifa
      const tarifa = await caller.pagos.createTarifa({
        cicloId: cycleMock.cicloId,
        nivelId: levelMock.nivelId,
        concepto: 'COLEG_SEC',
        monto: 3200,
        descripcion: 'Colegiatura de Secundaria'
      });
      expect(tarifa.tarifaId).toBeDefined();
      expect(Number(tarifa.monto)).toBe(3200);

      // 2. Listar Tarifas
      const list = await caller.pagos.getTarifas({
        cicloId: cycleMock.cicloId,
        nivelId: levelMock.nivelId
      });
      expect(list.length).toBe(1);
      expect(list[0].concepto).toBe('COLEG_SEC');

      // 3. Actualizar Tarifa
      const updated = await caller.pagos.updateTarifa({
        tarifaId: tarifa.tarifaId,
        monto: 3400
      });
      expect(Number(updated.monto)).toBe(3400);

      // 4. Eliminar Tarifa (Soft Delete)
      const deleted = await caller.pagos.deleteTarifa(tarifa.tarifaId);
      expect(deleted.eliminadoEn).not.toBeNull();
      expect(deleted.activa).toBe(false);

      const listAfter = await caller.pagos.getTarifas({ cicloId: cycleMock.cicloId });
      expect(listAfter.length).toBe(0);
    });
  });

  describe('RF-2: Calendario de Pagos (Adeudos)', () => {
    it('debería crear y listar adeudos pendientes del alumno', async () => {
      // 1. Crear Adeudo
      const adeudo = await caller.pagos.createAdeudo({
        alumnoId: studentMock.alumnoId,
        cicloId: cycleMock.cicloId,
        concepto: 'INSCRIPCION_2026',
        mes: 'Agosto',
        fechaVencimiento: new Date('2026-08-15T00:00:00.000Z').toISOString(),
        montoOriginal: 2500,
        saldoPendiente: 2500
      });
      expect(adeudo.calendarioPagoId).toBeDefined();
      expect(adeudo.estadoCobro).toBe('PENDIENTE');

      // 2. Listar Adeudos
      const list = await caller.pagos.getAdeudos({
        alumnoId: studentMock.alumnoId,
        estadoCobro: 'PENDIENTE'
      });
      expect(list.length).toBe(1);
      expect(list[0].concepto).toBe('INSCRIPCION_2026');
      expect(Number(list[0].saldoPendiente)).toBe(2500);
    });
  });

  describe('RF-3: Registro de Pagos e Incremento de Saldo a Favor', () => {
    it('debería liquidar adeudos y generar saldo a favor en transacciones atómicas', async () => {
      // Crear adeudos de prueba en la BD
      const ad1 = await prisma.calendarioPago.create({
        data: {
          calendarioPagoId: 1,
          alumnoId: studentMock.alumnoId,
          cicloId: cycleMock.cicloId,
          concepto: 'Colegiatura Sep',
          fechaVencimiento: new Date('2026-09-10'),
          montoOriginal: 3000,
          saldoPendiente: 3000,
          estadoCobro: 'PENDIENTE'
        }
      });

      const ad2 = await prisma.calendarioPago.create({
        data: {
          calendarioPagoId: 2,
          alumnoId: studentMock.alumnoId,
          cicloId: cycleMock.cicloId,
          concepto: 'Recargo Colegiatura',
          fechaVencimiento: new Date('2026-09-10'),
          montoOriginal: 400,
          saldoPendiente: 400,
          estadoCobro: 'PENDIENTE'
        }
      });

      // 1. Validar que arroje error si montoTotal es menor que la suma de las aplicaciones
      await expect(caller.pagos.registrarPago({
        alumnoId: studentMock.alumnoId,
        tutorId: tutorMock.tutorId,
        fechaPago: new Date().toISOString(),
        montoTotal: 3000, // Menor que 3400 aplicado
        metodoPago: 'TRANSFERENCIA',
        aplicaciones: [
          { calendarioPagoId: ad1.calendarioPagoId, montoAplicado: 3000, aplicadoA: 'CAPITAL' },
          { calendarioPagoId: ad2.calendarioPagoId, montoAplicado: 400, aplicadoA: 'RECARGO' }
        ]
      })).rejects.toThrowError(/El monto total del pago es menor que la suma de las aplicaciones indicadas/);

      // 2. Registrar pago exitoso liquidando ad1 y ad2 y dejando saldo a favor (Excedente)
      // Total aplicado = 3400. Monto total = 3700. Saldo a favor esperado = 300.
      const pagoResult = await caller.pagos.registrarPago({
        alumnoId: studentMock.alumnoId,
        tutorId: tutorMock.tutorId,
        fechaPago: new Date().toISOString(),
        montoTotal: 3700,
        metodoPago: 'TRANSFERENCIA',
        aplicaciones: [
          { calendarioPagoId: ad1.calendarioPagoId, montoAplicado: 3000, aplicadoA: 'CAPITAL' },
          { calendarioPagoId: ad2.calendarioPagoId, montoAplicado: 400, aplicadoA: 'RECARGO' }
        ]
      });

      expect(pagoResult.pagoId).toBeDefined();
      expect(Number(pagoResult.montoTotal)).toBe(3700);

      // Verificar que los adeudos estén liquidados ('PAGADO') en la BD
      const dbAd1 = await prisma.calendarioPago.findUnique({ where: { calendarioPagoId: ad1.calendarioPagoId } });
      const dbAd2 = await prisma.calendarioPago.findUnique({ where: { calendarioPagoId: ad2.calendarioPagoId } });
      expect(dbAd1?.estadoCobro).toBe('PAGADO');
      expect(Number(dbAd1?.saldoPendiente)).toBe(0);
      expect(Number(dbAd1?.montoPagado)).toBe(3000);
      expect(dbAd1?.liquidadoAt).not.toBeNull();

      expect(dbAd2?.estadoCobro).toBe('PAGADO');
      expect(Number(dbAd2?.saldoPendiente)).toBe(0);
      expect(dbAd2?.liquidadoAt).not.toBeNull();

      // Verificar que se incrementó el saldo a favor del Tutor
      const dbTutor = await prisma.tutor.findUnique({ where: { tutorId: tutorMock.tutorId } });
      expect(Number(dbTutor?.saldoAFavor)).toBe(300);

      // Verificar registro de movimiento de saldo
      const dbMovimiento = await prisma.movimientoSaldo.findFirst({
        where: { tutorId: tutorMock.tutorId, pagoId: pagoResult.pagoId }
      });
      expect(dbMovimiento).not.toBeNull();
      expect(dbMovimiento?.tipo).toBe('INGRESO');
      expect(Number(dbMovimiento?.monto)).toBe(300);

      // 3. Intentar aplicar un abono que excede el saldo pendiente (debería fallar)
      // Crear un adeudo nuevo
      const ad3 = await prisma.calendarioPago.create({
        data: {
          calendarioPagoId: 3,
          alumnoId: studentMock.alumnoId,
          cicloId: cycleMock.cicloId,
          concepto: 'Colegiatura Oct',
          fechaVencimiento: new Date('2026-10-10'),
          montoOriginal: 3000,
          saldoPendiente: 3000,
          estadoCobro: 'PENDIENTE'
        }
      });

      await expect(caller.pagos.registrarPago({
        alumnoId: studentMock.alumnoId,
        tutorId: tutorMock.tutorId,
        fechaPago: new Date().toISOString(),
        montoTotal: 3500,
        metodoPago: 'DEPOSITO',
        aplicaciones: [
          { calendarioPagoId: ad3.calendarioPagoId, montoAplicado: 3500, aplicadoA: 'CAPITAL' } // Excede el saldo pendiente (3000)
        ]
      })).rejects.toThrowError(/El monto aplicado al adeudo Colegiatura Oct excede su saldo pendiente/);
    });
  });
});
