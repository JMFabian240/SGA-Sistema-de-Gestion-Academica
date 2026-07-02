import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TutoresService } from './tutores.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';

describe('TutoresService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTutores', () => {
    it('debería retornar una lista de tutores activos', async () => {
      const mockTutores = [
        { tutorId: 1, nombreCompleto: 'Juan', eliminadoEn: null },
        { tutorId: 2, nombreCompleto: 'Maria', eliminadoEn: null }
      ];
      prismaMock.tutor.findMany.mockResolvedValue(mockTutores as any);

      const result = await TutoresService.getTutores();
      expect(result).toHaveLength(2);
      expect(prismaMock.tutor.findMany).toHaveBeenCalledWith({
        where: { eliminadoEn: null },
        include: { datosFiscales: true },
        orderBy: { nombreCompleto: 'asc' }
      });
    });
  });

  describe('getTutorById', () => {
    it('debería rechazar si el tutor no existe o está eliminado', async () => {
      prismaMock.tutor.findUnique.mockResolvedValue(null);
      await expect(TutoresService.getTutorById(1))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Tutor no encontrado' }));

      prismaMock.tutor.findUnique.mockResolvedValue({ eliminadoEn: new Date() } as any);
      await expect(TutoresService.getTutorById(1))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Tutor no encontrado' }));
    });

    it('debería retornar el tutor si existe y está activo', async () => {
      const mockTutor = { tutorId: 1, nombreCompleto: 'Juan', eliminadoEn: null };
      prismaMock.tutor.findUnique.mockResolvedValue(mockTutor as any);

      const result = await TutoresService.getTutorById(1);
      expect(result).toEqual(mockTutor);
    });
  });

  describe('createTutor', () => {
    it('debería rechazar si requiere factura pero no incluye datos fiscales', async () => {
      await expect(TutoresService.createTutor({ nombreCompleto: 'Test', requiereFactura: true }))
        .rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'Se requieren los datos fiscales si se solicita factura' }));
    });

    it('debería crear el tutor exitosamente sin datos fiscales', async () => {
      prismaMock.tutor.create.mockResolvedValue({ tutorId: 1, nombreCompleto: 'Test' } as any);

      const result = await TutoresService.createTutor({ nombreCompleto: 'Test', requiereFactura: false });
      expect(result.tutorId).toBe(1);
      expect(prismaMock.tutor.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { nombreCompleto: 'Test', requiereFactura: false }
      }));
    });

    it('debería crear el tutor y sus datos fiscales si se envían', async () => {
      prismaMock.tutor.create.mockResolvedValue({ tutorId: 1 } as any);

      await TutoresService.createTutor({ 
        nombreCompleto: 'Test', 
        requiereFactura: true,
        datosFiscales: { rfc: 'XAXX010101000', razonSocial: 'Perez' }
      });

      expect(prismaMock.tutor.create).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          nombreCompleto: 'Test',
          requiereFactura: true,
          datosFiscales: { create: { rfc: 'XAXX010101000', razonSocial: 'Perez' } }
        }
      }));
    });
  });

  describe('updateTutor', () => {
    it('debería rechazar si el tutor no existe', async () => {
      prismaMock.tutor.findUnique.mockResolvedValue(null);
      await expect(TutoresService.updateTutor({ tutorId: 1 }))
        .rejects.toThrowError(new TRPCError({ code: 'NOT_FOUND', message: 'Tutor no encontrado' }));
    });

    it('debería rechazar si pide factura sin datos fiscales previos ni nuevos', async () => {
      prismaMock.tutor.findUnique.mockResolvedValue({ tutorId: 1, requiereFactura: false, eliminadoEn: null } as any);
      prismaMock.datosFiscales.findUnique.mockResolvedValue(null);

      await expect(TutoresService.updateTutor({ tutorId: 1, requiereFactura: true }))
        .rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'Faltan los datos fiscales para habilitar la facturación' }));
    });

    it('debería actualizar e invocar el upsert de datos fiscales', async () => {
      prismaMock.tutor.findUnique.mockResolvedValue({ tutorId: 1, requiereFactura: true, eliminadoEn: null } as any);
      prismaMock.datosFiscales.findUnique.mockResolvedValue({ rfc: 'EXISTENTE' } as any);
      prismaMock.tutor.update.mockResolvedValue({} as any);

      await TutoresService.updateTutor({
        tutorId: 1,
        requiereFactura: true,
        datosFiscales: { rfc: 'NUEVO', razonSocial: 'Juan' }
      });

      const callArgs = prismaMock.tutor.update.mock.calls[0][0] as any;
      expect(callArgs.where.tutorId).toBe(1);
      expect(callArgs.data.datosFiscales.upsert.create.rfc).toBe('NUEVO');
      expect(callArgs.data.datosFiscales.upsert.update.rfc).toBe('NUEVO');
    });
  });

  describe('deleteTutor', () => {
    it('debería rechazar si el tutor tiene saldo a favor', async () => {
      prismaMock.tutor.findUnique.mockResolvedValue({ tutorId: 1, saldoAFavor: 100 } as any);
      
      await expect(TutoresService.deleteTutor(1))
        .rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'No se puede eliminar un tutor con saldo a favor activo' }));
    });

    it('debería realizar un soft delete marcando eliminadoEn y activo: false', async () => {
      prismaMock.tutor.findUnique.mockResolvedValue({ tutorId: 1, saldoAFavor: 0 } as any);
      prismaMock.tutor.update.mockResolvedValue({} as any);

      await TutoresService.deleteTutor(1);

      expect(prismaMock.tutor.update).toHaveBeenCalledWith({
        where: { tutorId: 1 },
        data: { eliminadoEn: expect.any(Date), activo: false }
      });
    });
  });
});
