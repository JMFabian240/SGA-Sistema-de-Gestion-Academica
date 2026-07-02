import { router, protectedProcedure } from '../../trpc';
import { z } from 'zod';
import { BecasService } from './becas.service';
import { 
  createBecaSchema, updateBecaSchema, 
  createSolicitudBecaSchema, resolverSolicitudBecaSchema, 
  assignBecaSchema 
} from './becas.schema';

export const becasRouter = router({
  // --- Catálogo de Becas ---
  getBecas: protectedProcedure.query(() => {
    return BecasService.getBecas();
  }),

  createBeca: protectedProcedure
    .input(createBecaSchema)
    .mutation(({ input }) => BecasService.createBeca(input)),

  updateBeca: protectedProcedure
    .input(updateBecaSchema)
    .mutation(({ input }) => BecasService.updateBeca(input)),

  deleteBeca: protectedProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => BecasService.deleteBeca(input)),

  // --- Solicitudes de Becas ---
  getSolicitudes: protectedProcedure
    .input(z.object({
      cicloId: z.number().int().positive().optional(),
      alumnoId: z.number().int().positive().optional()
    }).optional())
    .query(({ input }) => BecasService.getSolicitudes(input?.cicloId, input?.alumnoId)),

  createSolicitud: protectedProcedure
    .input(createSolicitudBecaSchema)
    .mutation(({ input, ctx }) => {
      const solicitadorId = ctx.user?.usuarioId;
      if (!solicitadorId) throw new Error("No user in context");
      return BecasService.createSolicitud(input, solicitadorId);
    }),

  resolverSolicitud: protectedProcedure
    .input(resolverSolicitudBecaSchema)
    .mutation(({ input, ctx }) => {
      const resolvedorId = ctx.user?.usuarioId;
      if (!resolvedorId) throw new Error("No user in context");
      return BecasService.resolverSolicitud(input, resolvedorId);
    }),

  // --- Asignación Directa ---
  assignBeca: protectedProcedure
    .input(assignBecaSchema)
    .mutation(({ input, ctx }) => {
      const asignadorId = ctx.user?.usuarioId;
      if (!asignadorId) throw new Error("No user in context");
      return BecasService.assignBeca(input, asignadorId);
    })
});
