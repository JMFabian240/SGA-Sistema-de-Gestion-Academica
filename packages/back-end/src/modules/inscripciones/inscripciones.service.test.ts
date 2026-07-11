import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InscripcionesService } from './inscripciones.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';

describe('InscripcionesService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
  });

  describe('Planes de Pago', () => {
    it('getPlanesPago debería retornar planes activos ordenados por creación', async () => {
      prismaMock.planPago.findMany.mockResolvedValue([{ planPagoId: 1, nombre: 'Mensual 10' }] as any);
      const result = await InscripcionesService.getPlanesPago();
      
      expect(result).toHaveLength(1);
      expect(prismaMock.planPago.findMany).toHaveBeenCalledWith({
        where: { eliminadoEn: null },
        orderBy: { creadoEn: 'desc' }
      });
    });

    it('createPlanPago debería crear un plan', async () => {
      prismaMock.planPago.create.mockResolvedValue({ planPagoId: 1 } as any);
      const result = await InscripcionesService.createPlanPago({ nombre: 'Bimestral', meses: 5, montoMensual: 5000, activo: true });
      expect(result.planPagoId).toBe(1);
    });

    it('updatePlanPago debería actualizar el plan', async () => {
      prismaMock.planPago.update.mockResolvedValue({ planPagoId: 1, nombre: 'Editado' } as any);
      const result = await InscripcionesService.updatePlanPago({ planPagoId: 1, nombre: 'Editado' });
      expect(result.nombre).toBe('Editado');
    });

    it('deletePlanPago debería aplicar soft delete', async () => {
      prismaMock.planPago.update.mockResolvedValue({ planPagoId: 1 } as any);
      await InscripcionesService.deletePlanPago(1);
      expect(prismaMock.planPago.update).toHaveBeenCalledWith({
        where: { planPagoId: 1 },
        data: { eliminadoEn: expect.any(Date), activo: false }
      });
    });
  });

  describe('Ventanas de Inscripción Temprana', () => {
    it('getVentanas debería retornar ventanas activas', async () => {
      prismaMock.ventanaInscripcionTemprana.findMany.mockResolvedValue([{ ventanaId: 1 }] as any);
      const result = await InscripcionesService.getVentanas();
      expect(result).toHaveLength(1);
      expect(prismaMock.ventanaInscripcionTemprana.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { eliminadoEn: null }
      }));
    });

    it('createVentana debería transformar strings a Date y crear la ventana', async () => {
      prismaMock.ventanaInscripcionTemprana.create.mockResolvedValue({ ventanaId: 1 } as any);
      await InscripcionesService.createVentana({
        cicloId: 1, becaId: 1, fechaInicio: '2023-01-01', fechaFin: '2023-02-01', activa: true
      });
      expect(prismaMock.ventanaInscripcionTemprana.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          fechaInicio: expect.any(Date),
          fechaFin: expect.any(Date)
        })
      }));
    });

    it('updateVentana debería transformar strings y actualizar', async () => {
      prismaMock.ventanaInscripcionTemprana.update.mockResolvedValue({ ventanaId: 1 } as any);
      await InscripcionesService.updateVentana({ ventanaId: 1, fechaInicio: '2023-05-01' });
      expect(prismaMock.ventanaInscripcionTemprana.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          fechaInicio: expect.any(Date)
        })
      }));
    });

    it('deleteVentana debería aplicar soft delete', async () => {
      prismaMock.ventanaInscripcionTemprana.update.mockResolvedValue({} as any);
      await InscripcionesService.deleteVentana(1);
      expect(prismaMock.ventanaInscripcionTemprana.update).toHaveBeenCalledWith({
        where: { ventanaId: 1 },
        data: { eliminadoEn: expect.any(Date), activa: false }
      });
    });
  });

  describe('Inscripciones de Alumnos', () => {
    it('getInscripciones debería incluir relaciones y filtrar por ciclo', async () => {
      prismaMock.inscripcionCiclo.findMany.mockResolvedValue([] as any);
      await InscripcionesService.getInscripciones(10);
      expect(prismaMock.inscripcionCiclo.findMany).toHaveBeenCalledWith({
        where: { eliminadoEn: null, cicloId: 10 },
        include: { alumno: true, grupo: true, planPago: true },
        orderBy: { fechaIngreso: 'desc' }
      });
    });

    it('createInscripcion debería rechazar si el alumno ya está inscrito en el ciclo', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue({ inscripcionId: 1 } as any);
      
      await expect(InscripcionesService.createInscripcion({
        alumnoId: 1, cicloId: 1, fechaIngreso: '2023-08-01', esIngresoTardio: false, estadoEnCiclo: 'ACTIVO', estadoFinanciero: 'AL_CORRIENTE'
      })).rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'El alumno ya se encuentra inscrito en este ciclo escolar.' }));
    });

    it('createInscripcion debería crear la inscripción si no existe duplicado y generar adeudos (10 meses)', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue(null);
      prismaMock.calificacion.findFirst.mockResolvedValue(null);
      prismaMock.planPago.findUnique.mockResolvedValue({
        planPagoId: 1,
        meses: 10,
        montoMensual: 1500,
        eliminadoEn: null
      } as any);
      prismaMock.inscripcionCiclo.create.mockResolvedValue({ inscripcionId: 5 } as any);
      prismaMock.calendarioPago.createMany.mockResolvedValue({ count: 10 } as any);

      const result = await InscripcionesService.createInscripcion({
        alumnoId: 1, cicloId: 1, fechaIngreso: '2023-08-01', esIngresoTardio: false, estadoEnCiclo: 'ACTIVO', estadoFinanciero: 'AL_CORRIENTE'
      });

      expect(result.inscripcionId).toBe(5);
      expect(prismaMock.inscripcionCiclo.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ fechaIngreso: expect.any(Date) })
      }));
      expect(prismaMock.calendarioPago.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ concepto: 'Colegiatura Septiembre', montoOriginal: 1500 })
          ])
        })
      );
    });

    it('createInscripcion debería rechazar si el grupo seleccionado no existe', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue(null);
      prismaMock.calificacion.findFirst.mockResolvedValue(null);
      prismaMock.grupo.findUnique.mockResolvedValue(null);

      await expect(InscripcionesService.createInscripcion({
        alumnoId: 1, cicloId: 1, grupoId: 99, fechaIngreso: '2023-08-01', esIngresoTardio: false, estadoEnCiclo: 'ACTIVO', estadoFinanciero: 'AL_CORRIENTE'
      })).rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'El grupo seleccionado no existe o ha sido eliminado.' }));
    });

    it('createInscripcion debería rechazar si el grupo seleccionado no tiene cupo', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue(null);
      prismaMock.calificacion.findFirst.mockResolvedValue(null);
      prismaMock.grupo.findUnique.mockResolvedValue({
        grupoId: 2,
        nombre: '1A',
        cupoMaximo: 2,
        eliminadoEn: null,
        inscripciones: [{ inscripcionId: 10 }, { inscripcionId: 11 }]
      } as any);

      await expect(InscripcionesService.createInscripcion({
        alumnoId: 1, cicloId: 1, grupoId: 2, fechaIngreso: '2023-08-01', esIngresoTardio: false, estadoEnCiclo: 'ACTIVO', estadoFinanciero: 'AL_CORRIENTE'
      })).rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'El grupo 1A ya ha alcanzado su cupo máximo de 2 alumnos.' }));
    });

    it('createInscripcion debería rechazar si el alumno tiene materias reprobadas (Gap 3)', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue(null);
      prismaMock.calificacion.findFirst.mockResolvedValue({ calificacionId: 1, valorNumerico: 5.5 } as any);

      await expect(InscripcionesService.createInscripcion({
        alumnoId: 1, cicloId: 1, fechaIngreso: '2023-08-01', esIngresoTardio: false, estadoEnCiclo: 'ACTIVO', estadoFinanciero: 'AL_CORRIENTE'
      })).rejects.toThrowError(new TRPCError({ code: 'FORBIDDEN', message: 'El alumno tiene materias reprobadas y no puede ser inscrito.' }));
    });

    it('createInscripcion debería generar adeudos correctamente para plan de 12 meses (Gap 2)', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue(null);
      prismaMock.calificacion.findFirst.mockResolvedValue(null);
      prismaMock.planPago.findUnique.mockResolvedValue({
        planPagoId: 1,
        meses: 12,
        montoMensual: 2000,
        montoDiciembre: 4000,
        eliminadoEn: null
      } as any);
      prismaMock.inscripcionCiclo.create.mockResolvedValue({ inscripcionId: 6 } as any);
      prismaMock.calendarioPago.createMany.mockResolvedValue({ count: 12 } as any);

      await InscripcionesService.createInscripcion({
        alumnoId: 1, cicloId: 1, fechaIngreso: '2023-08-01', esIngresoTardio: false, estadoEnCiclo: 'ACTIVO', estadoFinanciero: 'AL_CORRIENTE'
      });

      expect(prismaMock.calendarioPago.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ concepto: 'Colegiatura Diciembre', montoOriginal: 4000 }),
            expect.objectContaining({ concepto: 'Colegiatura Julio', montoOriginal: 0 })
          ])
        })
      );
    });

    it('updateInscripcion debería rechazar si la inscripción no existe', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue(null);
      await expect(InscripcionesService.updateInscripcion({ inscripcionId: 1, esIngresoTardio: true }))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada' }));
    });

    it('updateInscripcion debería actualizar si existe', async () => {
      prismaMock.inscripcionCiclo.findUnique.mockResolvedValue({ inscripcionId: 1, eliminadoEn: null } as any);
      prismaMock.inscripcionCiclo.update.mockResolvedValue({ inscripcionId: 1, esIngresoTardio: true } as any);

      const result = await InscripcionesService.updateInscripcion({ inscripcionId: 1, esIngresoTardio: true });
      expect(result.esIngresoTardio).toBe(true);
    });

    it('deleteInscripcion debería hacer soft delete marcándola como ANULADA', async () => {
      prismaMock.inscripcionCiclo.update.mockResolvedValue({} as any);
      await InscripcionesService.deleteInscripcion(1);
      
      expect(prismaMock.inscripcionCiclo.update).toHaveBeenCalledWith({
        where: { inscripcionId: 1 },
        data: { eliminadoEn: expect.any(Date), estadoEnCiclo: 'ANULADA' }
      });
    });
  });
});
