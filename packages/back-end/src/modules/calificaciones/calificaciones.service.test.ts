import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalificacionesService } from './calificaciones.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';

describe('CalificacionesService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Consultas de Calificaciones', () => {
    it('getCalificacionesGrupo debería filtrar por materia y asegurar que el alumno esté activo', async () => {
      prismaMock.calificacion.findMany.mockResolvedValue([] as any);
      await CalificacionesService.getCalificacionesGrupo({ grupoMateriaId: 1, periodoId: 2 });
      
      expect(prismaMock.calificacion.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          grupoMateriaId: 1,
          periodoId: 2,
          alumno: { eliminadoEn: null }
        }
      }));
    });

    it('getCalificacionesAlumno debería retornar el kárdex con relaciones ordenadas', async () => {
      prismaMock.calificacion.findMany.mockResolvedValue([] as any);
      await CalificacionesService.getCalificacionesAlumno({ alumnoId: 5 });
      
      expect(prismaMock.calificacion.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { alumnoId: 5 },
        orderBy: expect.any(Array)
      }));
    });
  });

  describe('Registro y Edición (Upsert)', () => {
    const inputMock = {
      alumnoId: 1,
      grupoMateriaId: 1,
      periodoId: 1,
      tipoEvaluacion: 'PARCIAL' as const,
      valorNumerico: 9.5,
      cuentaParaPromedio: true
    };

    it('debería rechazar si el alumno no existe o está inactivo', async () => {
      prismaMock.alumno.findUnique.mockResolvedValue(null);
      prismaMock.grupoMateria.findUnique.mockResolvedValue({} as any);

      await expect(CalificacionesService.upsertCalificacion(inputMock, 1))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado o inactivo' }));
    });

    it('debería rechazar si el grupoMateria no existe', async () => {
      prismaMock.alumno.findUnique.mockResolvedValue({ alumnoId: 1, eliminadoEn: null } as any);
      prismaMock.grupoMateria.findUnique.mockResolvedValue(null);

      await expect(CalificacionesService.upsertCalificacion(inputMock, 1))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Materia/Grupo no encontrado' }));
    });

    it('debería hacer UPDATE si la calificación ya existe', async () => {
      prismaMock.alumno.findUnique.mockResolvedValue({ alumnoId: 1, eliminadoEn: null } as any);
      prismaMock.grupoMateria.findUnique.mockResolvedValue({ grupoMateriaId: 1 } as any);
      prismaMock.calificacion.findFirst.mockResolvedValue({ calificacionId: 10 } as any);
      prismaMock.calificacion.update.mockResolvedValue({ calificacionId: 10, valorNumerico: 9.5 } as any);

      const result = await CalificacionesService.upsertCalificacion(inputMock, 2);

      expect(result.calificacionId).toBe(10);
      expect(prismaMock.calificacion.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { calificacionId: 10 },
        data: expect.objectContaining({ valorNumerico: 9.5, registradaPor: 2 })
      }));
      expect(prismaMock.calificacion.create).not.toHaveBeenCalled();
    });

    it('debería hacer CREATE si la calificación NO existe', async () => {
      prismaMock.alumno.findUnique.mockResolvedValue({ alumnoId: 1, eliminadoEn: null } as any);
      prismaMock.grupoMateria.findUnique.mockResolvedValue({ grupoMateriaId: 1 } as any);
      prismaMock.calificacion.findFirst.mockResolvedValue(null);
      prismaMock.calificacion.create.mockResolvedValue({ calificacionId: 11, valorNumerico: 9.5 } as any);

      const result = await CalificacionesService.upsertCalificacion(inputMock, 2);

      expect(result.calificacionId).toBe(11);
      expect(prismaMock.calificacion.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ valorNumerico: 9.5, registradaPor: 2 })
      }));
      expect(prismaMock.calificacion.update).not.toHaveBeenCalled();
    });
  });

  describe('Eliminación (Hard Delete)', () => {
    it('debería rechazar si no encuentra la calificación a borrar', async () => {
      prismaMock.calificacion.findUnique.mockResolvedValue(null);
      await expect(CalificacionesService.deleteCalificacion({ calificacionId: 1 }))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Calificación no encontrada' }));
    });

    it('debería hacer un borrado físico (delete) si existe', async () => {
      prismaMock.calificacion.findUnique.mockResolvedValue({ calificacionId: 1 } as any);
      prismaMock.calificacion.delete.mockResolvedValue({} as any);

      await CalificacionesService.deleteCalificacion({ calificacionId: 1 });

      expect(prismaMock.calificacion.delete).toHaveBeenCalledWith({
        where: { calificacionId: 1 }
      });
    });
  });
});
