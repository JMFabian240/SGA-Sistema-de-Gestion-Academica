import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { z } from 'zod';
import { BecasService } from './becas.service';
import { 
  createBecaSchema, updateBecaSchema, 
  createSolicitudBecaSchema, resolverSolicitudBecaSchema, 
  assignBecaSchema, revokeBecaSchema, updateAsignacionSchema
} from './becas.schema';

const escrituraConfiguracion = protectedProcedure.use(hasModulePermission('Configuracion', true));
const escrituraAlumnos = protectedProcedure.use(hasModulePermission('Alumnos', true));

export const becasRouter = router({
  // --- Catálogo de Becas ---
  getBecas: protectedProcedure.query(() => {
    return BecasService.getBecas();
  }),

  createBeca: escrituraConfiguracion
    .input(createBecaSchema)
    .mutation(({ input }) => BecasService.createBeca(input)),

  updateBeca: escrituraConfiguracion
    .input(updateBecaSchema)
    .mutation(({ input }) => BecasService.updateBeca(input)),

  deleteBeca: escrituraConfiguracion
    .input(z.number().int().positive())
    .mutation(({ input }) => BecasService.deleteBeca(input)),

  // --- Solicitudes de Becas ---
  getSolicitudes: protectedProcedure
    .input(z.object({
      cicloId: z.number().int().positive().optional(),
      alumnoId: z.number().int().positive().optional()
    }).optional())
    .query(({ input }) => BecasService.getSolicitudes(input?.cicloId, input?.alumnoId)),

  createSolicitud: escrituraAlumnos
    .input(createSolicitudBecaSchema)
    .mutation(({ input, ctx }) => {
      const solicitadorId = (ctx as any).user?.usuarioId;
      if (!solicitadorId) throw new Error("No user in context");
      return BecasService.createSolicitud(input, solicitadorId);
    }),

  resolverSolicitud: escrituraAlumnos
    .input(resolverSolicitudBecaSchema)
    .mutation(({ input, ctx }) => {
      const resolvedorId = (ctx as any).user?.usuarioId;
      if (!resolvedorId) throw new Error("No user in context");
      return BecasService.resolverSolicitud(input, resolvedorId);
    }),

  // --- Asignación Directa ---
  assignBeca: escrituraAlumnos
    .input(assignBecaSchema)
    .mutation(({ input, ctx }) => {
      const asignadorId = (ctx as any).user?.usuarioId;
      if (!asignadorId) throw new Error("No user in context");
      return BecasService.assignBeca(input, asignadorId);
    }),

  revokeBeca: escrituraAlumnos
    .input(revokeBecaSchema)
    .mutation(({ input, ctx }) => {
      const retiradorId = (ctx as any).user?.usuarioId;
      if (!retiradorId) throw new Error("No user in context");
      return BecasService.revokeBeca(input, retiradorId);
    }),

  getAsignaciones: protectedProcedure.query(() => {
    return BecasService.getAsignacionesActivas();
  }),

  updateAsignacion: escrituraAlumnos
    .input(updateAsignacionSchema)
    .mutation(({ input, ctx }) => {
      const actualizadorId = (ctx as any).user?.usuarioId;
      if (!actualizadorId) throw new Error("No user in context");
      return BecasService.updateAsignacion(input, actualizadorId);
    })
});

