import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Alumnos Router (Integration)', () => {
  it('debería crear un alumno con su tutor atómicamente', async () => {
    const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
    const ctx = {
      req: { headers: {} } as any,
      res: {} as any,
      prisma: prisma,
      token: validToken
    };
    const caller = appRouter.createCaller(ctx);

    await prisma.nivelEducativo.create({
      data: {
        nivelId: 1,
        nombre: 'Secundaria',
        codigo: 'SEC',
        orden: 1
      }
    });

    const tutorMock = {
      nombreCompleto: 'Juan Perez',
      parentesco: 'Padre',
      telefono: '5551234567',
      correo: 'juan.perez@test.com'
    };

    const alumnoMock = {
      nombre: 'Pedrito',
      apellidoPaterno: 'Perez',
      apellidoMaterno: 'Lopez',
      nombreCompleto: 'Pedrito Perez Lopez',
      fechaNacimiento: new Date('2010-05-15').toISOString(),
      curp: 'PELP100515HDFRRN01',
      sexo: 'M' as const,
      sangre: 'O+',
      nivelId: 1,
      estado: 'ACTIVO' as const,
      tutor: tutorMock
    };

    // 2. Act
    const result = await caller.alumnos.create(alumnoMock);

    // 3. Assert Response
    expect(result.alumnoId).toBeDefined();
    expect(result.matricula).toBeDefined();

    // 4. Assert Database State
    const dbAlumno = await prisma.alumno.findUnique({
      where: { alumnoId: result.alumnoId },
      include: { tutoresAlumnos: { include: { tutor: true } } }
    });

    expect(dbAlumno).not.toBeNull();
    expect(dbAlumno?.curp).toBe('PELP100515HDFRRN01');
  });

  it('debería rechazar si la CURP ya existe', async () => {
    const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
    const ctx = {
      req: { headers: {} } as any,
      res: {} as any,
      prisma: prisma,
      token: validToken
    };
    const caller = appRouter.createCaller(ctx);

    await prisma.nivelEducativo.create({
      data: {
        nivelId: 1,
        nombre: 'Secundaria',
        codigo: 'SEC',
        orden: 1
      }
    });

    const alumnoMock = {
      nombre: 'Pedrito',
      apellidoPaterno: 'Perez',
      apellidoMaterno: 'Lopez',
      nombreCompleto: 'Pedrito Perez Lopez',
      fechaNacimiento: new Date('2010-05-15').toISOString(),
      curp: 'DUPLICADA123456789',
      sexo: 'M' as const,
      sangre: 'O+',
      nivelId: 1,
      estado: 'ACTIVO' as const,
      tutor: {
        nombreCompleto: 'Maria',
        parentesco: 'Madre',
        telefono: '5551234567'
      }
    };

    // Insertamos primero para provocar el duplicado
    await caller.alumnos.create(alumnoMock);

    // Intentamos insertar de nuevo
    await expect(caller.alumnos.create(alumnoMock))
      .rejects.toThrowError(/Ya existe un alumno con ese CURP o Matrícula/);
  });
});
