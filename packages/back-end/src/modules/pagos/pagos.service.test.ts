import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PagosService } from './pagos.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';
import { MetodoPago } from '@prisma/client';
import { createTarifaSchema, createCalendarioPagoSchema } from './pagos.schema';

describe('PagosService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tarifas', () => {
    it('getTarifas debería retornar tarifas filtradas', async () => {
      prismaMock.tarifa.findMany.mockResolvedValue([] as any);
      await PagosService.getTarifas(1, 2);
      expect(prismaMock.tarifa.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { eliminadoEn: null, cicloId: 1, nivelId: 2 }
      }));
    });

    it('createTarifa debería crear una tarifa', async () => {
      prismaMock.tarifa.create.mockResolvedValue({ tarifaId: 1 } as any);
      const result = await PagosService.createTarifa({ concepto: 'Colegiatura', monto: 5000, nivelId: 1, cicloId: 1 });
      expect(result.tarifaId).toBe(1);
    });

    it('updateTarifa y deleteTarifa deberían funcionar correctamente', async () => {
      prismaMock.tarifa.findMany.mockResolvedValue([{ tarifaId: 1, cicloId: 1 }] as any);
      prismaMock.tarifa.update.mockResolvedValue({ tarifaId: 1 } as any);
      await PagosService.updateTarifa({ tarifaId: 1, monto: 6000 });
      expect(prismaMock.tarifa.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ monto: 6000 })
      }));

      await PagosService.deleteTarifa(1);
      expect(prismaMock.tarifa.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { tarifaId: 1 },
        data: expect.objectContaining({ activa: false, eliminadoEn: expect.any(Date) })
      }));
    });
  });

  describe('Calendario de Pagos (Adeudos)', () => {
    it('getAdeudosAlumno debería retornar adeudos filtrados', async () => {
      prismaMock.calendarioPago.findMany.mockResolvedValue([] as any);
      await PagosService.getAdeudosAlumno(1, 'PENDIENTE');
      expect(prismaMock.calendarioPago.findMany).toHaveBeenCalledWith({
        where: { alumnoId: 1, eliminadoEn: null, estadoCobro: 'PENDIENTE' },
        orderBy: { fechaVencimiento: 'asc' }
      });
    });

    it('createAdeudo debería crear y calcular estadoCobro PENDIENTE', async () => {
      prismaMock.calendarioPago.create.mockResolvedValue({ calendarioPagoId: 1 } as any);
      await PagosService.createAdeudo({
        alumnoId: 1, cicloId: 1, concepto: 'Test', 
        montoOriginal: 1000, montoPagado: 0, saldoPendiente: 1000, 
        fechaVencimiento: '2023-01-01', mes: 'ENERO'
      });
      expect(prismaMock.calendarioPago.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ estadoCobro: 'PENDIENTE' })
      }));
    });

    it('createAdeudo debería crear y calcular estadoCobro PAGADO si saldo es 0', async () => {
      prismaMock.calendarioPago.create.mockResolvedValue({ calendarioPagoId: 1 } as any);
      await PagosService.createAdeudo({
        alumnoId: 1, cicloId: 1, concepto: 'Test', 
        montoOriginal: 1000, montoPagado: 0, saldoPendiente: 0, 
        fechaVencimiento: '2023-01-01', mes: 'ENERO'
      });
      expect(prismaMock.calendarioPago.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ estadoCobro: 'PAGADO' })
      }));
    });

    it('updateAdeudo debería actualizar correctamente', async () => {
      prismaMock.calendarioPago.update.mockResolvedValue({} as any);
      await PagosService.updateAdeudo({ calendarioPagoId: 1, fechaVencimiento: '2023-02-01' });
      expect(prismaMock.calendarioPago.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ fechaVencimiento: expect.any(Date) })
      }));
    });
  });

  describe('Registro de Pagos', () => {
    it('debería rechazar si montoTotal es menor a las aplicaciones', async () => {
      await expect(PagosService.registrarPago({
        alumnoId: 1, tutorId: 1, fechaPago: '2023-01-01', montoTotal: 500, metodoPago: 'TRANSFERENCIA', requiereFactura: false, aplicadoASaldo: false,
        aplicaciones: [{ calendarioPagoId: 1, montoAplicado: 1000, aplicadoA: 'CAPITAL' }]
      }, 1)).rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'El monto total del pago es menor que la suma de las aplicaciones indicadas.' }));
    });

    it('debería registrar un pago simple correctamente (sin saldo a favor)', async () => {
      const mockAdeudo = { calendarioPagoId: 1, saldoPendiente: 1000, montoPagado: 0, estadoCobro: 'PENDIENTE' };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
      prismaMock.pago.create.mockResolvedValue({ pagoId: 99 } as any);
      prismaMock.calendarioPago.findUnique.mockResolvedValue(mockAdeudo as any);
      prismaMock.aplicacionPago.create.mockResolvedValue({} as any);
      prismaMock.calendarioPago.update.mockResolvedValue({} as any);

      const result = await PagosService.registrarPago({
        alumnoId: 1, tutorId: 1, fechaPago: '2023-01-01', montoTotal: 1000, metodoPago: 'TRANSFERENCIA', requiereFactura: false, aplicadoASaldo: false,
        aplicaciones: [{ calendarioPagoId: 1, montoAplicado: 1000, aplicadoA: 'CAPITAL' }]
      }, 2);

      expect(result.pagoId).toBe(99);
      expect(prismaMock.pago.create).toHaveBeenCalled();
      expect(prismaMock.aplicacionPago.create).toHaveBeenCalled();
      
      // Debe haber liquidado el adeudo
      expect(prismaMock.calendarioPago.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          montoPagado: 1000,
          saldoPendiente: 0,
          estadoCobro: 'PAGADO',
          liquidadoAt: expect.any(Date)
        })
      }));
      // NO debe haber generado saldo a favor
      expect(prismaMock.tutor.update).not.toHaveBeenCalled();
    });

    it('debería rechazar si una aplicación excede el saldo pendiente del adeudo', async () => {
      const mockAdeudo = { calendarioPagoId: 1, saldoPendiente: 500, concepto: 'Test' };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
      prismaMock.pago.create.mockResolvedValue({ pagoId: 99 } as any);
      prismaMock.calendarioPago.findUnique.mockResolvedValue(mockAdeudo as any);
      prismaMock.calendarioPago.findMany.mockResolvedValue([]); // Sin adeudos extras para absorber excedente

      await expect(PagosService.registrarPago({
        alumnoId: 1, tutorId: 1, fechaPago: '2023-01-01', montoTotal: 1000, metodoPago: 'TRANSFERENCIA', requiereFactura: false, aplicadoASaldo: false,
        aplicaciones: [{ calendarioPagoId: 1, montoAplicado: 600, aplicadoA: 'CAPITAL' }]
      }, 2)).rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'El monto aplicado al adeudo Test excede su saldo pendiente.' }));
    });

    it('debería aplicar automáticamente el excedente al siguiente adeudo pendiente', async () => {
      const mockAdeudo1 = { calendarioPagoId: 1, saldoPendiente: 500, montoPagado: 0, estadoCobro: 'PENDIENTE', concepto: 'Mes 1' };
      const mockAdeudo2 = { calendarioPagoId: 2, saldoPendiente: 800, montoPagado: 0, estadoCobro: 'PENDIENTE', concepto: 'Mes 2' };
      
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
      prismaMock.pago.create.mockResolvedValue({ pagoId: 99 } as any);
      
      // En la lógica, primero busca pendientes, y luego itera por las aplicaciones generadas
      prismaMock.calendarioPago.findMany.mockResolvedValue([mockAdeudo1, mockAdeudo2] as any);
      prismaMock.calendarioPago.findUnique.mockImplementation(((args: any) => {
        if (args.where.calendarioPagoId === 1) return Promise.resolve(mockAdeudo1);
        if (args.where.calendarioPagoId === 2) return Promise.resolve(mockAdeudo2);
        return Promise.resolve(null);
      }) as any);

      await PagosService.registrarPago({
        alumnoId: 1, tutorId: 1, fechaPago: '2023-01-01', montoTotal: 1000, metodoPago: 'TRANSFERENCIA', requiereFactura: false, aplicadoASaldo: false,
        aplicaciones: [{ calendarioPagoId: 1, montoAplicado: 500, aplicadoA: 'CAPITAL' }] // Sobran 500
      }, 2);

      // Verificamos que se creó una aplicación extra para el adeudo 2
      expect(prismaMock.aplicacionPago.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          calendarioPagoId: 2,
          montoAplicado: 500
        })
      }));
      
      // Tutor Update no debe llamarse porque saldo a favor es 0
      expect(prismaMock.tutor.update).not.toHaveBeenCalled();
    });

    it('debería registrar un pago parcial, dejando el adeudo en estado PARCIAL y restando el saldo pendiente', async () => {
      const mockAdeudo = { calendarioPagoId: 1, montoOriginal: 1200, saldoPendiente: 1200, montoPagado: 0, estadoCobro: 'PENDIENTE' };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
      prismaMock.pago.create.mockResolvedValue({ pagoId: 100 } as any);
      prismaMock.calendarioPago.findUnique.mockResolvedValue(mockAdeudo as any);
      prismaMock.calendarioPago.findMany.mockResolvedValue([]);
      prismaMock.aplicacionPago.create.mockResolvedValue({} as any);
      prismaMock.calendarioPago.update.mockResolvedValue({} as any);

      // Pagar 600 sobre deuda de 1200
      await PagosService.registrarPago({
        alumnoId: 1, tutorId: 1, fechaPago: '2023-02-01', montoTotal: 600, metodoPago: 'EFECTIVO', requiereFactura: false, aplicadoASaldo: false,
        aplicaciones: [{ calendarioPagoId: 1, montoAplicado: 600, aplicadoA: 'CAPITAL' }]
      }, 2);

      // Verificamos que el adeudo queda ABONO
      expect(prismaMock.calendarioPago.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { calendarioPagoId: 1 },
        data: expect.objectContaining({
          montoPagado: 600,
          saldoPendiente: 600,
          estadoCobro: 'ABONO'
        })
      }));
    });

    it('debería aplicar excedente como saldo a favor del tutor si no hay más adeudos', async () => {
      const mockAdeudo = { calendarioPagoId: 1, montoOriginal: 1200, saldoPendiente: 1200, montoPagado: 0, estadoCobro: 'PENDIENTE' };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
      prismaMock.pago.create.mockResolvedValue({ pagoId: 101 } as any);
      prismaMock.calendarioPago.findUnique.mockResolvedValue(mockAdeudo as any);
      // findMany retorna vacío, significando que NO hay otros adeudos
      prismaMock.calendarioPago.findMany.mockResolvedValue([]);
      prismaMock.aplicacionPago.create.mockResolvedValue({} as any);
      prismaMock.calendarioPago.update.mockResolvedValue({} as any);
      prismaMock.tutor.update.mockResolvedValue({} as any);

      // Pagar 1500 sobre deuda de 1200 (sobran 300)
      await PagosService.registrarPago({
        alumnoId: 1, tutorId: 1, fechaPago: '2023-03-01', montoTotal: 1500, metodoPago: 'TRANSFERENCIA', requiereFactura: false, aplicadoASaldo: false,
        aplicaciones: [{ calendarioPagoId: 1, montoAplicado: 1200, aplicadoA: 'CAPITAL' }]
      }, 2);

      // Verificamos que el adeudo original se pagó completamente
      expect(prismaMock.calendarioPago.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { calendarioPagoId: 1 },
        data: expect.objectContaining({
          estadoCobro: 'PAGADO',
          saldoPendiente: 0
        })
      }));

      // Verificamos que se incrementó el saldoAFavor del tutor en 300
      expect(prismaMock.tutor.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { tutorId: 1 },
        data: {
          saldoAFavor: { increment: 300 }
        }
      }));
    });
  });

  describe('Zod Schemas (Gap 6)', () => {
    it('createTarifaSchema debería aceptar conceptos de hasta 100 caracteres y rechazar más de 100', () => {
      const conceptoValido = 'a'.repeat(100);
      const conceptoInvalido = 'a'.repeat(101);

      const payloadValido = {
        cicloId: 1,
        nivelId: 1,
        concepto: conceptoValido,
        monto: 1000
      };

      const payloadInvalido = {
        cicloId: 1,
        nivelId: 1,
        concepto: conceptoInvalido,
        monto: 1000
      };

      expect(createTarifaSchema.safeParse(payloadValido).success).toBe(true);
      expect(createTarifaSchema.safeParse(payloadInvalido).success).toBe(false);
    });

    it('createCalendarioPagoSchema debería aceptar conceptos de hasta 100 caracteres y rechazar más de 100', () => {
      const conceptoValido = 'a'.repeat(100);
      const conceptoInvalido = 'a'.repeat(101);

      const payloadValido = {
        alumnoId: 1,
        cicloId: 1,
        concepto: conceptoValido,
        montoOriginal: 1000,
        saldoPendiente: 1000,
        fechaVencimiento: new Date().toISOString()
      };

      const payloadInvalido = {
        alumnoId: 1,
        cicloId: 1,
        concepto: conceptoInvalido,
        montoOriginal: 1000,
        saldoPendiente: 1000,
        fechaVencimiento: new Date().toISOString()
      };

      expect(createCalendarioPagoSchema.safeParse(payloadValido).success).toBe(true);
      expect(createCalendarioPagoSchema.safeParse(payloadInvalido).success).toBe(false);
    });
  });
});
