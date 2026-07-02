import { describe, it, expect } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Tutores Router (Integration)', () => {
  const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
  
  const ctx = {
    req: { headers: {} } as any,
    res: {} as any,
    prisma: prisma,
    token: validToken
  };

  it('debería crear un tutor exitosamente sin datos fiscales', async () => {
    const caller = appRouter.createCaller(ctx);

    const tutorMock = {
      nombreCompleto: 'Tutor De Prueba',
      correoElectronico: 'tutor@prueba.com',
      telefono: '5559876543'
    };

    const result = await caller.tutores.create(tutorMock);

    expect(result.tutorId).toBeDefined();
    
    // Verificar en DB
    const dbTutor = await prisma.tutor.findUnique({
      where: { tutorId: result.tutorId }
    });
    
    expect(dbTutor).not.toBeNull();
    expect(dbTutor?.nombreCompleto).toBe('Tutor De Prueba');
    expect(dbTutor?.correoElectronico).toBe('tutor@prueba.com');
  });

  it('debería crear un tutor con datos fiscales atómicamente', async () => {
    const caller = appRouter.createCaller(ctx);

    const tutorConFiscalMock = {
      nombreCompleto: 'Empresa Tutor SA de CV',
      correoElectronico: 'facturacion@empresa.com',
      requiereFactura: true,
      datosFiscales: {
        rfc: 'EMP123456789',
        razonSocial: 'Empresa Tutor SA de CV',
        regimenFiscal: '601',
        usoCfdi: 'G03'
      }
    };

    const result = await caller.tutores.create(tutorConFiscalMock);

    expect(result.tutorId).toBeDefined();

    // Verificar en DB incluyendo fiscales
    const dbTutor = await prisma.tutor.findUnique({
      where: { tutorId: result.tutorId },
      include: { datosFiscales: true }
    });

    expect(dbTutor).not.toBeNull();
    expect(dbTutor?.datosFiscales).not.toBeNull();
    expect(dbTutor?.datosFiscales?.rfc).toBe('EMP123456789');
  });

  it('debería rechazar si faltan datos requeridos (Zod)', async () => {
    const caller = appRouter.createCaller(ctx);

    const invalidTutorMock = {
      // Falta nombreCompleto que es requerido
      correoElectronico: 'incompleto@test.com'
    };

    await expect(caller.tutores.create(invalidTutorMock as any))
      .rejects.toThrowError(/Required|invalid_type/);
  });
});
