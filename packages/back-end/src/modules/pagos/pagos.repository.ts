import { prisma, Prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';

export class PagosRepository {
  // --- Tarifas ---
  static async getTarifas(cicloId?: number, nivelId?: number) {
    return prisma.tarifa.findMany({
      where: {
        eliminadoEn: null,
        ...(cicloId && { cicloId }),
        ...(nivelId && { nivelId })
      },
      include: {
        ciclo: true,
        nivel: true
      },
      orderBy: { creadoEn: 'desc' }
    });
  }

  static async createTarifa(data: Prisma.TarifaUncheckedCreateInput) {
    return prisma.tarifa.create({ data });
  }

  static async updateTarifa(tarifaId: number, data: Prisma.TarifaUncheckedUpdateInput) {
    return prisma.tarifa.update({
      where: { tarifaId },
      data
    });
  }

  static async deleteTarifa(tarifaId: number) {
    return prisma.tarifa.update({
      where: { tarifaId },
      data: { eliminadoEn: new Date(), activa: false }
    });
  }

  // --- Calendario de Pagos (Adeudos) ---
  static async getAdeudosAlumno(alumnoId: number, estadoCobro?: any) {
    return prisma.calendarioPago.findMany({
      where: {
        alumnoId,
        eliminadoEn: null,
        ...(estadoCobro && { estadoCobro })
      },
      orderBy: { fechaVencimiento: 'asc' }
    });
  }

  static async createAdeudo(data: Prisma.CalendarioPagoUncheckedCreateInput) {
    return prisma.calendarioPago.create({ data });
  }

  static async updateAdeudo(calendarioPagoId: number, data: Prisma.CalendarioPagoUncheckedUpdateInput) {
    return prisma.calendarioPago.update({
      where: { calendarioPagoId },
      data
    });
  }

  // --- Transacción de Registro de Pagos ---
  static async registrarPagoTransaccion(params: {
    pagoData: Prisma.PagoUncheckedCreateInput;
    aplicaciones: Array<{ calendarioPagoId: number; montoAplicado: number; aplicadoA: any }>;
    saldoAFavorGenerado: number;
    tutorId: number;
    registradorId: number;
  }) {
    const { pagoData, aplicaciones, saldoAFavorGenerado, tutorId, registradorId } = params;

    return prisma.$transaction(async (tx) => {
      // 1. Crear el Pago
      const pago = await tx.pago.create({
        data: pagoData
      });

      // 2. Procesar Aplicaciones
      for (const app of aplicaciones) {
        // Obtener el adeudo actual
        const adeudo = await tx.calendarioPago.findUnique({
          where: { calendarioPagoId: app.calendarioPagoId }
        });

        if (!adeudo || adeudo.eliminadoEn) {
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: `Adeudo ${app.calendarioPagoId} no encontrado` 
          });
        }

        // Validar que el monto no exceda el saldo pendiente
        if (app.montoAplicado > Number(adeudo.saldoPendiente)) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: `El monto aplicado al adeudo ${adeudo.concepto} excede su saldo pendiente.` 
          });
        }

        // Crear la aplicación
        await tx.aplicacionPago.create({
          data: {
            pagoId: pago.pagoId,
            calendarioPagoId: app.calendarioPagoId,
            montoAplicado: app.montoAplicado,
            aplicadoA: app.aplicadoA
          }
        });

        // Actualizar saldos del adeudo (con redondeo a 2 decimales para evitar problemas de precisión en punto flotante)
        const nuevoMontoPagado = Math.round((Number(adeudo.montoPagado) + app.montoAplicado) * 100) / 100;
        const nuevoSaldoPendiente = Math.round((Number(adeudo.saldoPendiente) - app.montoAplicado) * 100) / 100;
        
        let nuevoEstado = adeudo.estadoCobro;
        let liquidadoAt = adeudo.liquidadoAt;
        
        if (nuevoSaldoPendiente <= 0) {
          nuevoEstado = 'PAGADO';
          liquidadoAt = new Date();
        }

        await tx.calendarioPago.update({
          where: { calendarioPagoId: adeudo.calendarioPagoId },
          data: {
            montoPagado: nuevoMontoPagado,
            saldoPendiente: nuevoSaldoPendiente,
            estadoCobro: nuevoEstado,
            liquidadoAt
          }
        });
      }

      // 3. Manejo de saldo a favor del tutor
      if (saldoAFavorGenerado > 0) {
        await tx.tutor.update({
          where: { tutorId },
          data: {
            saldoAFavor: { increment: saldoAFavorGenerado }
          }
        });
        
        // Registrar movimiento de saldo
        await tx.movimientoSaldo.create({
          data: {
            tutorId,
            pagoId: pago.pagoId,
            tipo: 'INGRESO',
            monto: saldoAFavorGenerado,
            descripcion: 'Saldo a favor generado por exceso en pago.',
            creadoPor: registradorId
          }
        });
      }

      return pago;
    });
  }
}
