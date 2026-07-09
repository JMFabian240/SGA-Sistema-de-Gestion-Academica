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

  describe('Grados', () => {
    it('getGrados y createGrado', async () => {
      prismaMock.grado.findMany.mockResolvedValue([{ gradoId: 1, nombre: '1º Grado', numero: 1 }] as any);
      const result = await GruposService.getGrados();
      expect(result).toHaveLength(1);
      expect(prismaMock.grado.findMany).toHaveBeenCalledWith({
        where: { eliminadoEn: null },
        orderBy: { numero: 'asc' }
      });

      prismaMock.grado.create.mockResolvedValue({ gradoId: 1 } as any);
      await GruposService.createGrado({ nivelId: 1, numero: 1, nombre: '1º Grado' });
      expect(prismaMock.grado.create).toHaveBeenCalled();
    });

    it('updateGrado', async () => {
      prismaMock.grado.update.mockResolvedValue({} as any);
      await GruposService.updateGrado({ gradoId: 1, nombre: 'Primero' });
      expect(prismaMock.grado.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { gradoId: 1 },
        data: expect.objectContaining({ nombre: 'Primero' })
      }));
    });

    it('deleteGrado debería fallar si hay grupos, alumnos o materias asociadas', async () => {
      // 1. Simular grupo asociado
      prismaMock.grupo.findFirst.mockResolvedValue({ grupoId: 1 } as any);
      await expect(GruposService.deleteGrado(1)).rejects.toThrowError(
        'No se puede eliminar el grado porque tiene grupos asociados.'
      );

      // Reset
      prismaMock.grupo.findFirst.mockResolvedValue(null);

      // 2. Simular alumno asociado
      prismaMock.alumno.findFirst.mockResolvedValue({ alumnoId: 1 } as any);
      await expect(GruposService.deleteGrado(1)).rejects.toThrowError(
        'No se puede eliminar el grado porque tiene alumnos asociados.'
      );

      // Reset
      prismaMock.alumno.findFirst.mockResolvedValue(null);

      // 3. Simular materia asociada
      prismaMock.materia.findFirst.mockResolvedValue({ materiaId: 1 } as any);
      await expect(GruposService.deleteGrado(1)).rejects.toThrowError(
        'No se puede eliminar el grado porque tiene materias asociadas.'
      );
    });

    it('deleteGrado debería tener éxito si no hay dependencias', async () => {
      prismaMock.grupo.findFirst.mockResolvedValue(null);
      prismaMock.alumno.findFirst.mockResolvedValue(null);
      prismaMock.materia.findFirst.mockResolvedValue(null);
      prismaMock.grado.update.mockResolvedValue({} as any);

      await GruposService.deleteGrado(1);
      expect(prismaMock.grado.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { gradoId: 1 },
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
        include: { nivel: true, ciclo: true, grado: true, materias: expect.any(Object) }
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

    it('createGrupo debería rechazar si el grado del grupo no está permitido en el ciclo escolar (Gap 3)', async () => {
      prismaMock.cicloEscolar.findUnique.mockResolvedValue({
        cicloId: 1,
        gradosPermitidos: { PRI: [1, 2] }
      } as any);
      prismaMock.grado.findMany.mockResolvedValue([
        { gradoId: 1, numero: 1 },
        { gradoId: 2, numero: 2 }
      ] as any);

      await expect(GruposService.createGrupo({
        cicloId: 1,
        nombre: '3A',
        gradoId: 3,
        nivelId: 1,
        cupoMaximo: 30
      })).rejects.toThrowError('El grado/semestre 3 extraído del grupo "3A" no está habilitado en los grados permitidos del ciclo escolar.');
    });

    it('createGrupo debería tener éxito si el grado está habilitado en el ciclo escolar (Gap 3)', async () => {
      prismaMock.cicloEscolar.findUnique.mockResolvedValue({
        cicloId: 1,
        gradosPermitidos: { PRI: [1, 2] }
      } as any);
      prismaMock.grado.findMany.mockResolvedValue([
        { gradoId: 1, numero: 1 },
        { gradoId: 2, numero: 2 }
      ] as any);
      prismaMock.grupo.create.mockResolvedValue({ grupoId: 10, nombre: '1A' } as any);

      const result = await GruposService.createGrupo({
        cicloId: 1,
        nombre: '1A',
        gradoId: 1,
        nivelId: 1,
        cupoMaximo: 30
      });

      expect(result.grupoId).toBe(10);
      expect(prismaMock.grupo.create).toHaveBeenCalled();
    });
  });

  describe('Inicialización Selectiva de Grupos', () => {
    it('getGradosParaInicializar debe retornar grados no inicializados aún', async () => {
      prismaMock.cicloEscolar.findUnique.mockResolvedValue({
        cicloId: 1,
        gradosPermitidos: { "1": [1, 2] }
      } as any);

      prismaMock.grado.findMany.mockResolvedValue([
        { gradoId: 1, numero: 1, nombre: '1º Grado', nivelId: 1, nivel: { nombre: 'Primaria' } },
        { gradoId: 2, numero: 2, nombre: '2º Grado', nivelId: 1, nivel: { nombre: 'Primaria' } }
      ] as any);

      // Simular que el gradoId 1 ya tiene grupo en el ciclo 1
      prismaMock.grupo.findMany.mockResolvedValue([
        { gradoId: 1 }
      ] as any);

      const result = await GruposService.getGradosParaInicializar(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        gradoId: 2,
        nombreGrado: '2º Grado',
        nombreNivel: 'Primaria',
        nombrePropuesto: '2A'
      }));
    });

    it('getGradosParaInicializar debe lanzar error si no existe el ciclo', async () => {
      prismaMock.cicloEscolar.findUnique.mockResolvedValue(null);
      await expect(GruposService.getGradosParaInicializar(1)).rejects.toThrowError(
        'Ciclo escolar no encontrado.'
      );
    });

    it('inicializarGruposSeleccionados debe crear los grupos en transacción', async () => {
      prismaMock.cicloEscolar.findUnique.mockResolvedValue({ cicloId: 1 } as any);
      
      // Mock de transacción
      prismaMock.$transaction.mockImplementation(async (cb) => {
        return cb(prismaMock);
      });

      prismaMock.grado.findUnique.mockResolvedValue({ gradoId: 2, nivelId: 1 } as any);
      prismaMock.grupo.findFirst.mockResolvedValue(null); // No duplicado
      prismaMock.grupo.create.mockResolvedValue({} as any);

      const result = await GruposService.inicializarGruposSeleccionados({
        cicloId: 1,
        grupos: [
          { gradoId: 2, nombre: '2A', cupoMaximo: 25 }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(prismaMock.grupo.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          cicloId: 1,
          gradoId: 2,
          nombre: '2A',
          cupoMaximo: 25
        })
      }));
    });
  });
});
