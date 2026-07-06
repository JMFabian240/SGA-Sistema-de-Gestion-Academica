import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlumnosService } from './alumnos.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';
import { EstadoAlumno } from '@prisma/client';

describe('AlumnosService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAlumnos', () => {
    it('debería retornar una lista de alumnos activos', async () => {
      const mockAlumnos = [
        { alumnoId: 1, nombreCompleto: 'Juan Perez', eliminadoEn: null },
        { alumnoId: 2, nombreCompleto: 'Maria Lopez', eliminadoEn: null }
      ];
      prismaMock.alumno.findMany.mockResolvedValue(mockAlumnos as any);

      const result = await AlumnosService.getAlumnos();
      expect(result).toHaveLength(2);
      expect(prismaMock.alumno.findMany).toHaveBeenCalledWith({
        where: { eliminadoEn: null },
        include: expect.any(Object),
        orderBy: { nombreCompleto: 'asc' }
      });
    });
  });

  describe('getAlumnoById', () => {
    it('debería rechazar si el alumno no existe o está eliminado', async () => {
      prismaMock.alumno.findUnique.mockResolvedValue(null);
      await expect(AlumnosService.getAlumnoById(1))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' }));

      prismaMock.alumno.findUnique.mockResolvedValue({ eliminadoEn: new Date() } as any);
      await expect(AlumnosService.getAlumnoById(1))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' }));
    });

    it('debería retornar el alumno si existe y está activo', async () => {
      const mockAlumno = { alumnoId: 1, nombreCompleto: 'Juan', eliminadoEn: null };
      prismaMock.alumno.findUnique.mockResolvedValue(mockAlumno as any);

      const result = await AlumnosService.getAlumnoById(1);
      expect(result).toEqual(mockAlumno);
    });
  });

  describe('createAlumno', () => {
    const inputMock = {
      curp: 'CURP123',
      nombreCompleto: 'Juan Perez',
      fechaNacimiento: '2010-01-01',
      sexo: 'M',
      nivelId: 1,
      estado: 'ACTIVO' as EstadoAlumno
    };

    it('debería rechazar si el CURP ya existe', async () => {
      prismaMock.alumno.findFirst.mockResolvedValue({ alumnoId: 2 } as any);

      await expect(AlumnosService.createAlumno(inputMock))
        .rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'Ya existe un alumno con ese CURP o Matrícula' }));
    });

    it('debería crear el alumno si los datos son únicos', async () => {
      prismaMock.alumno.findFirst.mockResolvedValue(null);
      prismaMock.alumno.create.mockResolvedValue({ alumnoId: 1, ...inputMock, fechaNacimiento: new Date('2010-01-01') } as any);

      const result = await AlumnosService.createAlumno(inputMock);
      expect(result.alumnoId).toBe(1);
      expect(prismaMock.alumno.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ curp: 'CURP123' })
      });
    });
  });

  describe('updateAlumno', () => {
    it('debería rechazar si el alumno a actualizar no existe o está eliminado', async () => {
      prismaMock.alumno.findUnique.mockResolvedValue(null);
      await expect(AlumnosService.updateAlumno({ alumnoId: 1, nombreCompleto: 'Editado' }))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' }));
    });

    it('debería actualizar los datos correctamente', async () => {
      prismaMock.alumno.findUnique.mockResolvedValue({ alumnoId: 1, eliminadoEn: null } as any);
      prismaMock.alumno.update.mockResolvedValue({ alumnoId: 1, nombreCompleto: 'Editado' } as any);

      const result = await AlumnosService.updateAlumno({ alumnoId: 1, nombreCompleto: 'Editado' });
      expect(result.nombreCompleto).toBe('Editado');
      expect(prismaMock.alumno.update).toHaveBeenCalled();
    });
  });

  describe('deleteAlumno', () => {
    it('debería hacer un soft delete actualizando estado y eliminadoEn, y anular matrículas y adeudos en cascada', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
      prismaMock.alumno.update.mockResolvedValue({ alumnoId: 1 } as any);
      prismaMock.inscripcionCiclo.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.calendarioPago.updateMany.mockResolvedValue({ count: 2 } as any);

      await AlumnosService.deleteAlumno(1);

      const callArgs = prismaMock.alumno.update.mock.calls[0][0] as any;
      expect(callArgs.where.alumnoId).toBe(1);
      expect(callArgs.data.estado).toBe('BAJA_DEFINITIVA');
      expect(callArgs.data.eliminadoEn).toBeInstanceOf(Date);

      expect(prismaMock.inscripcionCiclo.updateMany).toHaveBeenCalledWith({
        where: { alumnoId: 1, eliminadoEn: null },
        data: {
          eliminadoEn: expect.any(Date),
          estadoEnCiclo: 'ANULADA'
        }
      });

      expect(prismaMock.calendarioPago.updateMany).toHaveBeenCalledWith({
        where: {
          alumnoId: 1,
          estadoCobro: { in: ['PENDIENTE', 'VENCIDO'] },
          eliminadoEn: null
        },
        data: {
          estadoCobro: 'CANCELADO',
          eliminadoEn: expect.any(Date)
        }
      });
    });
  });

  describe('TutorAlumno Relaciones', () => {
    it('linkTutor debería quitar el estado principal de otros si este esPrincipal', async () => {
      prismaMock.tutorAlumno.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.tutorAlumno.findUnique.mockResolvedValue(null);
      prismaMock.tutorAlumno.create.mockResolvedValue({} as any);

      await AlumnosService.linkTutor({ tutorId: 1, alumnoId: 1, parentesco: 'Padre', esPrincipal: true });

      expect(prismaMock.tutorAlumno.updateMany).toHaveBeenCalledWith({
        where: { alumnoId: 1, esPrincipal: true },
        data: { esPrincipal: false }
      });
      expect(prismaMock.tutorAlumno.create).toHaveBeenCalled();
    });

    it('unlinkTutor debería borrar la relación', async () => {
      prismaMock.tutorAlumno.delete.mockResolvedValue({} as any);
      await AlumnosService.unlinkTutor({ tutorAlumnoId: 1 });
      expect(prismaMock.tutorAlumno.delete).toHaveBeenCalledWith({ where: { tutorAlumnoId: 1 } });
    });
  });
});
