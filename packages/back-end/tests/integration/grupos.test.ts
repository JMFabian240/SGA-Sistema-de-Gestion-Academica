import { describe, it, expect } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Grupos Router (Integration)', () => {
  const validToken = jwt.sign({ usuarioId: 1, rol: 'ADMIN' }, process.env.JWT_SECRET || 'test_secret_integration_key');
  
  const ctx = {
    req: { headers: {} } as any,
    res: {} as any,
    prisma: prisma,
    token: validToken
  };

  it('debería crear la estructura completa: Nivel, Ciclo, Materia, Grupo y Asignación', async () => {
    const caller = appRouter.createCaller(ctx);

    // 1. Crear Nivel Educativo
    const nivelResult = await caller.grupos.createNivel({
      codigo: 'PRI',
      nombre: 'Primaria',
      orden: 2
    });
    expect(nivelResult.nivelId).toBeDefined();

    // 2. Crear Ciclo Escolar
    const cicloResult = await caller.grupos.createCiclo({
      nombre: '2024-2025',
      fechaInicio: new Date('2024-08-01').toISOString(),
      fechaFin: new Date('2025-07-15').toISOString(),
      activo: true
    });
    expect(cicloResult.cicloId).toBeDefined();

    // 3. Crear Materia
    const materiaResult = await caller.grupos.createMateria({
      nombre: 'Matemáticas I',
      clave: 'MAT-1'
    });
    expect(materiaResult.materiaId).toBeDefined();

    // 4. Crear Grupo
    const grupoResult = await caller.grupos.createGrupo({
      nivelId: nivelResult.nivelId,
      cicloId: cicloResult.cicloId,
      nombre: '1A',
      cupoMaximo: 30
    });
    expect(grupoResult.grupoId).toBeDefined();

    // 5. Asignar Materia al Grupo
    const assignResult = await caller.grupos.assignMateria({
      grupoId: grupoResult.grupoId,
      materiaId: materiaResult.materiaId
    });
    expect(assignResult.grupoMateriaId).toBeDefined();

    // 6. Verificar Estado Final en Base de Datos
    const dbGrupoMateria = await prisma.grupoMateria.findUnique({
      where: { grupoMateriaId: assignResult.grupoMateriaId },
      include: {
        grupo: { include: { nivel: true, ciclo: true } },
        materia: true
      }
    });

    expect(dbGrupoMateria).not.toBeNull();
    expect(dbGrupoMateria?.materia.clave).toBe('MAT-1');
    expect(dbGrupoMateria?.grupo.nombre).toBe('1A');
    expect(dbGrupoMateria?.grupo.nivel.codigo).toBe('PRI');
    expect(dbGrupoMateria?.grupo.ciclo.nombre).toBe('2024-2025');
  });

  it('debería rechazar creación de Nivel Educativo si faltan campos requeridos (Zod)', async () => {
    const caller = appRouter.createCaller(ctx);

    const invalidNivel = {
      nombre: 'Secundaria'
      // Falta código y orden
    };

    await expect(caller.grupos.createNivel(invalidNivel as any))
      .rejects.toThrowError(/Required|invalid_type/);
  });
});
