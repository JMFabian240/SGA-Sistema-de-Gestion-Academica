import { TRPCError } from '@trpc/server';
import type { 
  CreateTarifaInput, UpdateTarifaInput, 
  CreateCalendarioPagoInput, UpdateCalendarioPagoInput, 
  RegistrarPagoInput 
} from './pagos.schema';
import { PagosRepository } from './pagos.repository';

export class PagosService {
  
  // --- Tarifas ---
  static async getTarifas(cicloId?: number, nivelId?: number) {
    return PagosRepository.getTarifas(cicloId, nivelId);
  }

  static async createTarifa(input: CreateTarifaInput) {
    return PagosRepository.createTarifa(input);
  }

  static async updateTarifa(input: UpdateTarifaInput) {
    const { tarifaId, ...data } = input;
    return PagosRepository.updateTarifa(tarifaId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteTarifa(tarifaId: number) {
    return PagosRepository.deleteTarifa(tarifaId);
  }

  // --- Calendario de Pagos (Adeudos) ---
  static async getAdeudosAlumno(alumnoId: number, estadoCobro?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO') {
    return PagosRepository.getAdeudosAlumno(alumnoId, estadoCobro);
  }

  static async createAdeudo(input: CreateCalendarioPagoInput) {
    return PagosRepository.createAdeudo({
      ...input,
      fechaVencimiento: new Date(input.fechaVencimiento),
      estadoCobro: input.saldoPendiente > 0 ? 'PENDIENTE' : 'PAGADO'
    });
  }

  static async updateAdeudo(input: UpdateCalendarioPagoInput) {
    const { calendarioPagoId, fechaVencimiento, ...data } = input;
    return PagosRepository.updateAdeudo(calendarioPagoId, {
      ...data,
      ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }),
      actualizadoEn: new Date()
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

    // Delegar transacción al repositorio
    return PagosRepository.registrarPagoTransaccion({
      pagoData: {
        alumnoId: input.alumnoId,
        tutorId: input.tutorId,
        fechaPago: new Date(input.fechaPago),
        montoTotal: input.montoTotal,
        metodoPago: input.metodoPago,
        aplicadoASaldo: input.aplicadoASaldo,
        observaciones: input.observaciones,
        registradoPor: registradorId
      },
      aplicaciones: input.aplicaciones,
      saldoAFavorGenerado,
      tutorId: input.tutorId,
      registradorId
    });
  }
}
