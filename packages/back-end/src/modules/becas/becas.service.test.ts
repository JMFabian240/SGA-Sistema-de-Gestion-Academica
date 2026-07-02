import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BecasService } from './becas.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';
import { EstadoBeca } from '@prisma/client';

describe('BecasService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Catálogo de Becas', () => {
    it('getBecas debería retornar becas activas', async () => {
      const mockBecas = [{ becaId: 1, nombreBeca: 'Excelencia' }];
      prismaMock.beca.findMany.mockResolvedValue(mockBecas as any);

      const result = await BecasService.getBecas();
      expect(result).toHaveLength(1);
      expect(prismaMock.beca.findMany).toHaveBeenCalledWith({
        where: { eliminadoEn: null },
        orderBy: { nombreBeca: 'asc' }
      });
    });

    it('createBeca debería crear una beca', async () => {
      prismaMock.beca.create.mockResolvedValue({ becaId: 1 } as any);
      const result = await BecasService.createBeca({ nombreBeca: 'Test', criterio: 'ACADEMICA', porcentaje: 10 });
      expect(result.becaId).toBe(1);
    });

    it('updateBeca debería actualizar una beca', async () => {
      prismaMock.beca.update.mockResolvedValue({ becaId: 1, porcentaje: 20 } as any);
      const result = await BecasService.updateBeca({ becaId: 1, porcentaje: 20 });
      expect(result.porcentaje).toBe(20);
    });

    it('deleteBeca debería hacer soft delete', async () => {
      prismaMock.beca.update.mockResolvedValue({} as any);
      await BecasService.deleteBeca(1);
      expect(prismaMock.beca.update).toHaveBeenCalledWith({
        where: { becaId: 1 },
        data: { eliminadoEn: expect.any(Date) }
      });
    });
  });

  describe('Solicitudes de Beca', () => {
    it('getSolicitudes debería filtrar correctamente', async () => {
      prismaMock.solicitudBeca.findMany.mockResolvedValue([] as any);
      await BecasService.getSolicitudes(1, 2);
      expect(prismaMock.solicitudBeca.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { eliminadoEn: null, cicloId: 1, alumnoId: 2 }
      }));
    });

    it('createSolicitud debería rechazar si ya existe una solicitud activa', async () => {
      prismaMock.solicitudBeca.findFirst.mockResolvedValue({ solicitudId: 1 } as any);

      await expect(BecasService.createSolicitud({
        alumnoId: 1, becaId: 1, cicloId: 1, estado: 'ACTIVA' as EstadoBeca
      }, 1)).rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'El alumno ya cuenta con una solicitud activa para esta beca en este ciclo.' }));
    });

    it('createSolicitud debería crear exitosamente si no hay duplicados', async () => {
      prismaMock.solicitudBeca.findFirst.mockResolvedValue(null);
      prismaMock.solicitudBeca.create.mockResolvedValue({ solicitudId: 1 } as any);

      const result = await BecasService.createSolicitud({
        alumnoId: 1, becaId: 1, cicloId: 1, estado: 'ACTIVA' as EstadoBeca
      }, 2);

      expect(result.solicitudId).toBe(1);
      expect(prismaMock.solicitudBeca.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ solicitadaPor: 2 })
      }));
    });

    describe('resolverSolicitud', () => {
      it('debería rechazar si la solicitud no existe o está eliminada', async () => {
        prismaMock.solicitudBeca.findUnique.mockResolvedValue(null);
        await expect(BecasService.resolverSolicitud({ solicitudId: 1, aprobar: true }, 1))
          .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Solicitud no encontrada' }));
      });

      it('debería rechazar si la solicitud ya no está ACTIVA', async () => {
        prismaMock.solicitudBeca.findUnique.mockResolvedValue({ estado: 'CANCELADA' } as any);
        await expect(BecasService.resolverSolicitud({ solicitudId: 1, aprobar: true }, 1))
          .rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'Esta solicitud ya ha sido resuelta o cancelada' }));
      });

      it('debería rechazar la solicitud y NO crear asignación si aprobar es false', async () => {
        prismaMock.solicitudBeca.findUnique.mockResolvedValue({ estado: 'ACTIVA', solicitudId: 1 } as any);
        // Simular transacción retornando un callback ejecutado mockeado
        prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
        prismaMock.solicitudBeca.update.mockResolvedValue({ estado: 'CANCELADA' } as any);

        const result = await BecasService.resolverSolicitud({ solicitudId: 1, aprobar: false }, 2);

        expect(result.solicitud.estado).toBe('CANCELADA');
        expect(result.asignacion).toBeNull();
        expect(prismaMock.solicitudBeca.update).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ estado: 'CANCELADA', resueltaPor: 2 })
        }));
        expect(prismaMock.asignacionBeca.create).not.toHaveBeenCalled();
      });

      it('debería aprobar la solicitud y CREAR asignación si aprobar es true', async () => {
        prismaMock.solicitudBeca.findUnique.mockResolvedValue({ 
          estado: 'ACTIVA', solicitudId: 1, alumnoId: 5, becaId: 2, cicloId: 3 
        } as any);
        prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
        prismaMock.solicitudBeca.update.mockResolvedValue({ estado: 'ACTIVA' } as any);
        prismaMock.asignacionBeca.create.mockResolvedValue({ asignacionId: 10 } as any);

        const result = await BecasService.resolverSolicitud({ solicitudId: 1, aprobar: true }, 2);

        expect(result.asignacion).not.toBeNull();
        expect(prismaMock.solicitudBeca.update).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ estado: 'ACTIVA' })
        }));
        expect(prismaMock.asignacionBeca.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ alumnoId: 5, asignadaPor: 2 })
        }));
      });
    });
  });

  describe('Asignación Directa de Becas', () => {
    it('assignBeca debería crear una asignacion', async () => {
      prismaMock.asignacionBeca.create.mockResolvedValue({ asignacionId: 1 } as any);
      
      const result = await BecasService.assignBeca({
        alumnoId: 1, becaId: 1, cicloId: 1, estado: 'ACTIVA' as EstadoBeca, fechaAsignacion: '2023-01-01'
      }, 5);

      expect(result.asignacionId).toBe(1);
      expect(prismaMock.asignacionBeca.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ asignadaPor: 5 })
      }));
    });
  });
});
