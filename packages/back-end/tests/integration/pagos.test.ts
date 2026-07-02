import { describe, it, expect } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Pagos Router (Integration)', () => {
  const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
  
  const ctx = {
    req: { headers: {} } as any,
    res: {} as any,
    prisma: prisma,
    token: validToken,
    user: { usuarioId: 1, rol: 'ADMIN' }
  };

  it('debería crear una tarifa, un adeudo y registrar su pago atómicamente', async () => {
    const caller = appRouter.createCaller(ctx);

    // 1. Preparar BD con dependencias
    await prisma.usuario.create({
      data: {
        usuarioId: 1,
        nombreUsuario: 'admin_pagos',
        nombreCompleto: 'Admin Pagos',
        correo: 'admin.pagos@test.com',
        passwordHash: 'hash_falso',
      }
    });

    const nivel = await prisma.nivelEducativo.create({
      data: { codigo: 'SEC', nombre: 'Secundaria', orden: 3 }
    });

    const ciclo = await prisma.cicloEscolar.create({
      data: {
        nombre: '2024-2025',
        fechaInicio: new Date('2024-08-01'),
        fechaFin: new Date('2025-07-15'),
        activo: true
      }
    });

    const tutor = await prisma.tutor.create({
      data: {
        nombreCompleto: 'Tutor Pago',
        correoElectronico: 'tutor.pago@test.com',
        telefono: '5551234567'
      }
    });

    const alumno = await prisma.alumno.create({
      data: {
        nombreCompleto: 'Alumno Pago',
        curp: 'ALUMNOPAGO12345678',
        fechaNacimiento: new Date('2010-05-15'),
        sexo: 'F',
        estado: 'ACTIVO',
        nivelId: nivel.nivelId
      }
    });

    // 2. Crear Tarifa
    const tarifaResult = await caller.pagos.createTarifa({
      cicloId: ciclo.cicloId,
      nivelId: nivel.nivelId,
      concepto: 'COLEGIATURA',
      monto: 1500.00,
      activa: true
    });
    expect(tarifaResult.tarifaId).toBeDefined();

    // 3. Crear Adeudo (Calendario de Pago)
    const adeudoResult = await caller.pagos.createAdeudo({
      alumnoId: alumno.alumnoId,
      cicloId: ciclo.cicloId,
      concepto: 'Colegiatura Enero',
      mes: 'ENERO',
      fechaVencimiento: new Date('2025-01-10').toISOString(),
      montoOriginal: 1500.00,
      saldoPendiente: 1500.00
    });
    expect(adeudoResult.calendarioPagoId).toBeDefined();
    expect(adeudoResult.estadoCobro).toBe('PENDIENTE');

    // 4. Registrar Pago
    const pagoResult = await caller.pagos.registrarPago({
      alumnoId: alumno.alumnoId,
      tutorId: tutor.tutorId,
      fechaPago: new Date('2025-01-05').toISOString(),
      montoTotal: 1500.00,
      metodoPago: 'TRANSFERENCIA',
      aplicaciones: [
        {
          calendarioPagoId: adeudoResult.calendarioPagoId,
          montoAplicado: 1500.00,
          aplicadoA: 'CAPITAL'
        }
      ]
    });
    expect(pagoResult.pagoId).toBeDefined();
    
    // 5. Verificar que el adeudo cambió su estado a PAGADO
    const dbAdeudo = await prisma.calendarioPago.findUnique({
      where: { calendarioPagoId: adeudoResult.calendarioPagoId }
    });

    expect(dbAdeudo).not.toBeNull();
    expect(dbAdeudo?.estadoCobro).toBe('PAGADO');
    expect(dbAdeudo?.saldoPendiente.toNumber()).toBe(0);
    expect(dbAdeudo?.montoPagado?.toNumber()).toBe(1500.00);

    // 6. Verificar la Aplicacion de Pago
    const dbAplicacion = await prisma.aplicacionPago.findFirst({
      where: { pagoId: pagoResult.pagoId }
    });
    expect(dbAplicacion).not.toBeNull();
    expect(dbAplicacion?.montoAplicado.toNumber()).toBe(1500.00);
  });

  it('debería rechazar un pago sin aplicaciones (Zod)', async () => {
    const caller = appRouter.createCaller(ctx);

    const invalidPago = {
      alumnoId: 1,
      tutorId: 1,
      fechaPago: new Date().toISOString(),
      montoTotal: 100,
      metodoPago: 'EFECTIVO', // Inválido (no está en el enum)
      aplicaciones: [] // Inválido (requiere min 1)
    };

    await expect(caller.pagos.registrarPago(invalidPago as any))
      .rejects.toThrowError(/Debe existir al menos una aplicación del pago|invalid_enum_value/);
  });
});
