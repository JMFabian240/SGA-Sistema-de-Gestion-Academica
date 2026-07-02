import { describe, it, expect } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Calificaciones Router (Integration)', () => {
  const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
  
  const ctx = {
    req: { headers: {} } as any,
    res: {} as any,
    prisma: prisma,
    token: validToken,
    user: { usuarioId: 1, rol: 'ADMIN' }
  };

  it('debería registrar y actualizar una calificación exitosamente (upsert)', async () => {
    const caller = appRouter.createCaller(ctx);

    // 1. Preparar dependencias en BD
    await prisma.usuario.create({
      data: {
        usuarioId: 1,
        nombreUsuario: 'admin_calif',
        nombreCompleto: 'Admin Calificaciones',
        correo: 'admin.calif@test.com',
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

    const materia = await prisma.materia.create({
      data: { nombre: 'Física I', clave: 'FIS1' }
    });

    const grupo = await prisma.grupo.create({
      data: {
        nivelId: nivel.nivelId,
        cicloId: ciclo.cicloId,
        nombre: '3A',
        cupoMaximo: 30
      }
    });

    const grupoMateria = await prisma.grupoMateria.create({
      data: {
        grupoId: grupo.grupoId,
        materiaId: materia.materiaId,
        docenteId: 1
      }
    });

    const alumno = await prisma.alumno.create({
      data: {
        nombreCompleto: 'Alumno Calificacion',
        curp: 'ALUMNOCALIF1234567',
        fechaNacimiento: new Date('2010-05-15'),
        sexo: 'M',
        estado: 'ACTIVO',
        nivelId: nivel.nivelId
      }
    });

    // 2. Registrar calificación (Insert)
    const upsertResult = await caller.calificaciones.upsert({
      alumnoId: alumno.alumnoId,
      grupoMateriaId: grupoMateria.grupoMateriaId,
      periodoId: 1, // Primer Bimestre
      tipoEvaluacion: 'BIMESTRE',
      valorNumerico: 9.5,
      textoObservacion: 'Excelente trabajo'
    });
    
    expect(upsertResult.calificacionId).toBeDefined();

    // 3. Verificar en BD (Insert)
    let dbCalificacion = await prisma.calificacion.findUnique({
      where: { calificacionId: upsertResult.calificacionId }
    });
    expect(dbCalificacion).not.toBeNull();
    expect(dbCalificacion?.valorNumerico?.toNumber()).toBe(9.5);
    expect(dbCalificacion?.textoObservacion).toBe('Excelente trabajo');

    // 4. Registrar calificación (Update del mismo periodo)
    const updateResult = await caller.calificaciones.upsert({
      alumnoId: alumno.alumnoId,
      grupoMateriaId: grupoMateria.grupoMateriaId,
      periodoId: 1, // Mismo periodo
      tipoEvaluacion: 'BIMESTRE',
      valorNumerico: 10.0,
      textoObservacion: 'Corregido a 10'
    });

    expect(updateResult.calificacionId).toBe(upsertResult.calificacionId); // Debe ser el mismo ID

    // 5. Verificar en BD (Update)
    dbCalificacion = await prisma.calificacion.findUnique({
      where: { calificacionId: updateResult.calificacionId }
    });
    expect(dbCalificacion?.valorNumerico?.toNumber()).toBe(10);
    expect(dbCalificacion?.textoObservacion).toBe('Corregido a 10');
  });

  it('debería rechazar si no se envía ni valor numérico ni cualitativo (Zod Refine)', async () => {
    const caller = appRouter.createCaller(ctx);

    const calificacionInvalida = {
      alumnoId: 1,
      grupoMateriaId: 1,
      periodoId: 1,
      tipoEvaluacion: 'BIMESTRE' as const,
      // Falta valorNumerico y valorCualitativo
      textoObservacion: 'No tiene valor'
    };

    await expect(caller.calificaciones.upsert(calificacionInvalida))
      .rejects.toThrowError(/Debe proporcionar al menos un valor numérico o cualitativo/);
  });
});
