import { router, gestorProcedure } from '../../trpc';
import { z } from 'zod';
import { PagosService } from './pagos.service';
import { 
  createTarifaSchema, updateTarifaSchema, 
  createCalendarioPagoSchema, updateCalendarioPagoSchema, 
  registrarPagoSchema 
} from './pagos.schema';

export const pagosRouter = router({
  
  // --- Tarifas ---
  getTarifas: gestorProcedure
    .input(z.object({
      cicloId: z.number().int().positive().optional(),
      nivelId: z.number().int().positive().optional()
    }).optional())
    .query(({ input }) => {
      return PagosService.getTarifas(input?.cicloId, input?.nivelId);
    }),

  createTarifa: gestorProcedure
    .input(createTarifaSchema)
    .mutation(({ input }) => PagosService.createTarifa(input)),

  updateTarifa: gestorProcedure
    .input(updateTarifaSchema)
    .mutation(({ input }) => PagosService.updateTarifa(input)),

  deleteTarifa: gestorProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => PagosService.deleteTarifa(input)),

  // --- Adeudos (Calendario de Pagos) ---
  getAdeudos: gestorProcedure
    .input(z.object({
      alumnoId: z.number().int().positive(),
      estadoCobro: z.enum(['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO']).optional()
    }))
    .query(({ input }) => PagosService.getAdeudosAlumno(input.alumnoId, input.estadoCobro)),

  createAdeudo: gestorProcedure
    .input(createCalendarioPagoSchema)
    .mutation(({ input }) => PagosService.createAdeudo(input)),

  updateAdeudo: gestorProcedure
    .input(updateCalendarioPagoSchema)
    .mutation(({ input }) => PagosService.updateAdeudo(input)),

  // --- Registro de Pagos ---
  registrarPago: gestorProcedure
    .input(registrarPagoSchema)
    .mutation(({ input, ctx }) => {
      // Tomar el registradorId directamente del token JWT decodificado en ctx
      const registradorId = ctx.user?.usuarioId;
      if (!registradorId) throw new Error("No user in context");
      
      return PagosService.registrarPago(input, registradorId);
    })
});
