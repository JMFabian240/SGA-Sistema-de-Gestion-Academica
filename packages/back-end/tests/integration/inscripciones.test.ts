import { describe, it, expect } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Inscripciones Router (Integration)', () => {
  const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
  
  const ctx = {
    req: { headers: {} } as any,
    res: {} as any,
    prisma: prisma,
    token: validToken
  };

  it('debería crear un plan de pago e inscribir a un alumno exitosamente', async () => {
    const caller = appRouter.createCaller(ctx);

    // 1. Preparar BD con dependencias
    const nivel = await prisma.nivelEducativo.create({
      data: { codigo: 'PREP', nombre: 'Preparatoria', orden: 4 }
    });

    const ciclo = await prisma.cicloEscolar.create({
      data: {
        nombre: '2024-2025',
        fechaInicio: new Date('2024-08-01'),
        fechaFin: new Date('2025-07-15'),
        activo: true
      }
    });

    const alumno = await prisma.alumno.create({
      data: {
        nombreCompleto: 'Alumno Inscripcion',
        curp: 'ALUMNOINSC12345678',
        fechaNacimiento: new Date('2005-05-15'),
        sexo: 'M',
        estado: 'ACTIVO',
        nivelId: nivel.nivelId
      }
    });

    // 2. Crear Plan de Pago
    const planResult = await caller.inscripciones.createPlanPago({
      nombre: 'Plan Normal 10 Meses',
      meses: 10,
      montoMensual: 2000.00,
      montoDiciembre: 1000.00,
      activo: true
    });
    expect(planResult.planPagoId).toBeDefined();

    // 3. Crear Inscripción
    const inscripcionResult = await caller.inscripciones.createInscripcion({
      alumnoId: alumno.alumnoId,
      cicloId: ciclo.cicloId,
      planPagoId: planResult.planPagoId,
      fechaIngreso: new Date('2024-08-15').toISOString(),
      esIngresoTardio: false,
      estadoEnCiclo: 'INSCRITO',
      estadoFinanciero: 'AL_CORRIENTE'
    });
    expect(inscripcionResult.inscripcionId).toBeDefined();

    // 4. Verificar en Base de Datos
    const dbInscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId: inscripcionResult.inscripcionId },
      include: {
        alumno: true,
        ciclo: true,
        planPago: true
      }
    });

    expect(dbInscripcion).not.toBeNull();
    expect(dbInscripcion?.alumno.curp).toBe('ALUMNOINSC12345678');
    expect(dbInscripcion?.planPago.meses).toBe(10);
    expect(dbInscripcion?.planPago.montoMensual.toNumber()).toBe(2000);
    expect(dbInscripcion?.estadoEnCiclo).toBe('INSCRITO');
  });

  it('debería rechazar inscripción si el plan de pago no existe (Constraint BD)', async () => {
    const caller = appRouter.createCaller(ctx);

    // Preparar dependencias
    const nivel = await prisma.nivelEducativo.create({
      data: { codigo: 'PREP2', nombre: 'Preparatoria 2', orden: 4 }
    });

    const ciclo = await prisma.cicloEscolar.create({
      data: {
        nombre: '2025-2026',
        fechaInicio: new Date('2025-08-01'),
        fechaFin: new Date('2026-07-15'),
        activo: true
      }
    });

    const alumno = await prisma.alumno.create({
      data: {
        nombreCompleto: 'Alumno Fallido',
        curp: 'FALLIDO1234567890',
        fechaNacimiento: new Date('2005-05-15'),
        sexo: 'M',
        estado: 'ACTIVO',
        nivelId: nivel.nivelId
      }
    });

    const inscripcionInvalida = {
      alumnoId: alumno.alumnoId,
      cicloId: ciclo.cicloId,
      planPagoId: 99999, // No existe en BD
      fechaIngreso: new Date('2024-08-15').toISOString(),
      esIngresoTardio: false,
      estadoEnCiclo: 'INSCRITO',
      estadoFinanciero: 'AL_CORRIENTE'
    };

    // Prisma lanzará un P2003 (Foreign key constraint violated)
    await expect(caller.inscripciones.createInscripcion(inscripcionInvalida))
      .rejects.toThrowError(/Foreign key constraint violated/);
  });
});
