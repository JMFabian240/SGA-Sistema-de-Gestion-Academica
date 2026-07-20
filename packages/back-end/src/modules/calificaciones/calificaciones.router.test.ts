// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '../../router';
import { prismaMock } from '../../../tests/setup/prisma-mock';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ usuarioId: 99, jti: 'test-jti' }))
  }
}));

describe('Calificaciones Router (Unit - Historial/Kardex)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ctxMock = {
    prisma: prismaMock as any,
    user: { usuarioId: 99, jti: 'test-jti' },
    req: {} as any,
    res: {} as any,
    token: 'fake-token'
  };

  const caller = appRouter.createCaller(ctxMock as any);

  describe('obtenerKardexCompleto', () => {
    it('debería retornar el historial mapeado con ciclo, nivel, materia y calificación', async () => {
      // Mock del historial completo basado en la estructura de Prisma
      prismaMock.calificacion.findMany.mockResolvedValue([
        {
          valorNumerico: 9.5,
          grupoMateria: {
            materia: { nombre: 'Matemáticas I' },
            grupo: {
              nivel: { nombre: 'Secundaria' },
              ciclo: { nombre: '2022-2023' }
            }
          }
        },
        {
          valorCualitativo: 'Aprobado',
          grupoMateria: {
            materia: { nombre: 'Historia I' },
            grupo: {
              nivel: { nombre: 'Secundaria' },
              ciclo: { nombre: '2022-2023' }
            }
          }
        }
      ] as any);

      const result = await caller.calificaciones.obtenerKardexCompleto({ alumnoId: 1 });

      expect(prismaMock.calificacion.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { alumnoId: 1 }
      }));

      // Validamos el mapeo
      expect(result.length).toBe(2);
      expect(result[0].materia).toBe('Matemáticas I');
      expect(result[0].calificacion).toBe(9.5);
      expect(result[0].ciclo).toBe('2022-2023');
      expect(result[0].nivel).toBe('Secundaria');

      expect(result[1].calificacion).toBe('Aprobado'); // Test fallback a valor cualitativo
    });

    it('debería retornar un arreglo vacío si el alumno no tiene calificaciones', async () => {
      prismaMock.calificacion.findMany.mockResolvedValue([]);

      const result = await caller.calificaciones.obtenerKardexCompleto({ alumnoId: 2 });

      expect(result).toEqual([]);
    });
  });
});
