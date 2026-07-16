import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { z } from 'zod';
import { PagosService } from './pagos.service';
import { 
  createTarifaSchema, updateTarifaSchema, 
  createCalendarioPagoSchema, updateCalendarioPagoSchema, 
  registrarPagoSchema, createCargoExtraordinarioSchema,
  adjuntarComprobanteSchema
} from './pagos.schema';

const lectura = protectedProcedure.use(hasModulePermission('Pagos', false));
const escritura = protectedProcedure.use(hasModulePermission('Pagos', true));

export const pagosRouter = router({
  
  // --- Tarifas ---
  getTarifas: lectura
    .input(z.object({
      cicloId: z.number().int().positive().optional(),
      nivelId: z.number().int().positive().optional()
    }).optional())
    .query(({ input }) => {
      return PagosService.getTarifas(input?.cicloId, input?.nivelId);
    }),

  createTarifa: escritura
    .input(createTarifaSchema)
    .mutation(({ input }) => PagosService.createTarifa(input)),

  updateTarifa: escritura
    .input(updateTarifaSchema)
    .mutation(({ input }) => PagosService.updateTarifa(input)),

  deleteTarifa: escritura
    .input(z.number().int().positive())
    .mutation(({ input }) => PagosService.deleteTarifa(input)),

  // --- Adeudos (Calendario de Pagos) ---
  getAdeudos: lectura
    .input(z.object({
      alumnoId: z.number().int().positive(),
      estadoCobro: z.enum(['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO']).optional()
    }))
    .query(({ input }) => PagosService.getAdeudosAlumno(input.alumnoId, input.estadoCobro)),

  createAdeudo: escritura
    .input(createCalendarioPagoSchema)
    .mutation(({ input }) => PagosService.createAdeudo(input)),

  updateAdeudo: escritura
    .input(updateCalendarioPagoSchema)
    .mutation(({ input }) => PagosService.updateAdeudo(input)),

  registrarPago: escritura
    .input(registrarPagoSchema)
    .mutation(({ input, ctx }) => {
      const registradorId = (ctx as any).user?.usuarioId;
      if (!registradorId) throw new Error("No user in context");
      
      return PagosService.registrarPago(input, registradorId);
    }),

  recalcularCalendario: escritura
    .input(z.object({ alumnoId: z.number().int().positive() }))
    .mutation(({ input, ctx }) => {
      const registradorId = (ctx as any).user?.usuarioId;
      if (!registradorId) throw new Error("No user in context");
      
      return PagosService.recalcularCalendario(input.alumnoId, registradorId);
    }),

  // --- Comprobantes Adjuntos ---
  adjuntarComprobante: escritura
    .input(adjuntarComprobanteSchema)
    .mutation(async ({ input, ctx }) => {
      const registradorId = (ctx as any).user?.usuarioId;
      if (!registradorId) throw new Error("No user in context");
      return PagosService.adjuntarComprobante(input, registradorId);
    }),

  getComprobanteBase64: lectura
    .input(z.object({ pagoId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return PagosService.getComprobanteBase64(input.pagoId);
    }),

  getReciboPago: lectura
    .input(z.object({ pagoId: z.number().int().positive() }))
    .query(({ input }) => {
      return PagosService.getReciboPago(input.pagoId);
    }),

  // --- Cargos Extraordinarios ---
  createCargoExtraordinario: escritura
    .input(createCargoExtraordinarioSchema)
    .mutation(({ input }) => PagosService.createCargoExtraordinario(input)),

  // --- Estado de Cuenta ---
  getEstadoCuenta: lectura
    .input(z.object({
      alumnoId: z.number().int().positive(),
      cicloId: z.number().int().positive()
    }))
    .query(({ input }) => {
      return PagosService.getEstadoCuenta(input.alumnoId, input.cicloId);
    })
});
