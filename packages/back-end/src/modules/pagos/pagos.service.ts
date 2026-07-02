import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { 
  type CreateTarifaInput, type UpdateTarifaInput, 
  type CreateCalendarioPagoInput, type UpdateCalendarioPagoInput, 
  type RegistrarPagoInput 
} from './pagos.schema';

export class PagosService {
  
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

  static async createTarifa(input: CreateTarifaInput) {
    return prisma.tarifa.create({ data: input });
  }

  static async updateTarifa(input: UpdateTarifaInput) {
    const { tarifaId, ...data } = input;
    return prisma.tarifa.update({
      where: { tarifaId },
      data: { ...data, actualizadoEn: new Date() }
    });
  }

  static async deleteTarifa(tarifaId: number) {
    return prisma.tarifa.update({
      where: { tarifaId },
      data: { eliminadoEn: new Date(), activa: false }
    });
  }

  // --- Calendario de Pagos (Adeudos) ---
  static async getAdeudosAlumno(alumnoId: number, estadoCobro?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO') {
    return prisma.calendarioPago.findMany({
      where: {
        alumnoId,
        eliminadoEn: null,
        ...(estadoCobro && { estadoCobro })
      },
      orderBy: { fechaVencimiento: 'asc' }
    });
  }

  static async createAdeudo(input: CreateCalendarioPagoInput) {
    return prisma.calendarioPago.create({
      data: {
        ...input,
        fechaVencimiento: new Date(input.fechaVencimiento),
        estadoCobro: input.saldoPendiente > 0 ? 'PENDIENTE' : 'PAGADO'
      }
    });
  }

  static async updateAdeudo(input: UpdateCalendarioPagoInput) {
    const { calendarioPagoId, fechaVencimiento, ...data } = input;
    return prisma.calendarioPago.update({
      where: { calendarioPagoId },
      data: {
        ...data,
        ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }),
        actualizadoEn: new Date()
      }
    });
  }

  // --- Registro de Pagos ---
  static async registrarPago(input: RegistrarPagoInput, registradorId: number) {
    // Calcular suma de aplicaciones para validar contra el monto total
    const totalAplicado = input.aplicaciones.reduce((acc, app) => acc + app.montoAplicado, 0);

    // Permitir que el montoTotal sea mayor (para guardar saldo a favor)
    // Pero nunca menor a lo que se intenta aplicar.
    if (input.montoTotal < totalAplicado) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El monto total del pago es menor que la suma de las aplicaciones indicadas.'
      });
    }

    const saldoAFavorGenerado = input.montoTotal - totalAplicado;

    // Ejecutar registro de pago, aplicaciones y actualización de adeudos en una sola transacción
    return prisma.$transaction(async (tx) => {
      
      // 1. Crear el Pago
      const pago = await tx.pago.create({
        data: {
          alumnoId: input.alumnoId,
          tutorId: input.tutorId,
          fechaPago: new Date(input.fechaPago),
          montoTotal: input.montoTotal,
          metodoPago: input.metodoPago,
          aplicadoASaldo: input.aplicadoASaldo,
          observaciones: input.observaciones,
          registradoPor: registradorId
        }
      });

      // 2. Procesar Aplicaciones
      for (const app of input.aplicaciones) {
        // Obtener el adeudo actual
        const adeudo = await tx.calendarioPago.findUnique({
          where: { calendarioPagoId: app.calendarioPagoId }
        });

        if (!adeudo || adeudo.eliminadoEn) {
          throw new TRPCError({ code: 'NOT_FOUND', message: `Adeudo ${app.calendarioPagoId} no encontrado` });
        }

        // Validar que el monto no exceda el saldo pendiente (permitiendo decimal error de 0.01)
        if (app.montoAplicado > Number(adeudo.saldoPendiente)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `El monto aplicado al adeudo ${adeudo.concepto} excede su saldo pendiente.` });
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

        // Actualizar saldos del adeudo
        const nuevoMontoPagado = Number(adeudo.montoPagado) + app.montoAplicado;
        const nuevoSaldoPendiente = Number(adeudo.saldoPendiente) - app.montoAplicado;
        
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
          where: { tutorId: input.tutorId },
          data: {
            saldoAFavor: { increment: saldoAFavorGenerado }
          }
        });
        
        // Registrar movimiento de saldo
        await tx.movimientoSaldo.create({
          data: {
            tutorId: input.tutorId,
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
