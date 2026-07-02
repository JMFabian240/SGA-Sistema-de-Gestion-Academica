import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GruposService } from './grupos.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';

describe('GruposService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Niveles Educativos', () => {
    it('getNiveles debería retornar niveles ordenados', async () => {
      prismaMock.nivelEducativo.findMany.mockResolvedValue([{ nivelId: 1, nombre: 'Primaria' }] as any);
      const result = await GruposService.getNiveles();
      expect(result).toHaveLength(1);
      expect(prismaMock.nivelEducativo.findMany).toHaveBeenCalledWith({
        where: { eliminadoEn: null },
        orderBy: { orden: 'asc' }
      });
    });

    it('createNivel, updateNivel y deleteNivel', async () => {
      prismaMock.nivelEducativo.create.mockResolvedValue({ nivelId: 1 } as any);
      await GruposService.createNivel({ nombre: 'Secundaria', orden: 2, codigo: 'SEC' });
      expect(prismaMock.nivelEducativo.create).toHaveBeenCalled();

      prismaMock.nivelEducativo.update.mockResolvedValue({} as any);
      await GruposService.updateNivel({ nivelId: 1, orden: 3 });
      expect(prismaMock.nivelEducativo.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { nivelId: 1 },
        data: expect.objectContaining({ orden: 3 })
      }));

      await GruposService.deleteNivel(1);
      expect(prismaMock.nivelEducativo.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { nivelId: 1 },
        data: expect.objectContaining({ eliminadoEn: expect.any(Date) })
      }));
    });
  });

  describe('Ciclos Escolares', () => {
    it('createCiclo transforma strings de fechas', async () => {
      prismaMock.cicloEscolar.create.mockResolvedValue({ cicloId: 1 } as any);
      await GruposService.createCiclo({
        nombre: '2023-2024', fechaInicio: '2023-08-01', fechaFin: '2024-07-01', activo: false
      });
      expect(prismaMock.cicloEscolar.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          fechaInicio: expect.any(Date),
          fechaFin: expect.any(Date)
        })
      }));
    });

    it('updateCiclo desactiva otros ciclos si se marca como activo', async () => {
      prismaMock.$transaction.mockResolvedValue([{ count: 5 }, { cicloId: 1 }] as any);
      prismaMock.cicloEscolar.findUnique.mockResolvedValue({ cicloId: 1 } as any);

      await GruposService.updateCiclo({ cicloId: 1, activo: true });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      const transactionCalls = prismaMock.$transaction.mock.calls[0][0] as unknown as any[];
      
      // Debe haber dos operaciones en la transacción
      expect(transactionCalls).toHaveLength(2);
    });

    it('updateCiclo hace update simple si no cambia activo a true', async () => {
      prismaMock.cicloEscolar.update.mockResolvedValue({ cicloId: 1 } as any);
      await GruposService.updateCiclo({ cicloId: 1, nombre: 'Cambio' });
      expect(prismaMock.cicloEscolar.update).toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('Materias', () => {
    it('CRUD básico', async () => {
      prismaMock.materia.create.mockResolvedValue({ materiaId: 1 } as any);
      await GruposService.createMateria({ nombre: 'Mate', clave: 'MAT' });
      expect(prismaMock.materia.create).toHaveBeenCalled();

      prismaMock.materia.update.mockResolvedValue({} as any);
      await GruposService.deleteMateria(1);
      expect(prismaMock.materia.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { eliminadoEn: expect.any(Date) }
      }));
    });
  });

  describe('Grupos y Asignaciones', () => {
    it('getGrupos incluye materias y nivel', async () => {
      prismaMock.grupo.findMany.mockResolvedValue([] as any);
      await GruposService.getGrupos(1);
      expect(prismaMock.grupo.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { eliminadoEn: null, cicloId: 1 },
        include: { nivel: true, ciclo: true, materias: expect.any(Object) }
      }));
    });

    it('assign y unassign materia', async () => {
      prismaMock.grupoMateria.create.mockResolvedValue({} as any);
      await GruposService.assignMateriaToGrupo({ grupoId: 1, materiaId: 1, docenteId: 1 });
      expect(prismaMock.grupoMateria.create).toHaveBeenCalled();

      prismaMock.grupoMateria.delete.mockResolvedValue({} as any);
      await GruposService.unassignMateriaFromGrupo({ grupoMateriaId: 1 });
      expect(prismaMock.grupoMateria.delete).toHaveBeenCalledWith({ where: { grupoMateriaId: 1 } });
    });
  });
});
