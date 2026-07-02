import { router, protectedProcedure } from '../../trpc';
import { z } from 'zod';
import { InscripcionesService } from './inscripciones.service';
import { 
  createPlanPagoSchema, updatePlanPagoSchema, 
  createVentanaInscripcionSchema, updateVentanaInscripcionSchema, 
  createInscripcionSchema, updateInscripcionSchema 
} from './inscripciones.schema';

export const inscripcionesRouter = router({
  
  // --- Planes de Pago ---
  getPlanesPago: protectedProcedure.query(() => InscripcionesService.getPlanesPago()),

  createPlanPago: protectedProcedure
    .input(createPlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.createPlanPago(input)),

  updatePlanPago: protectedProcedure
    .input(updatePlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.updatePlanPago(input)),

  deletePlanPago: protectedProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deletePlanPago(input)),

  // --- Ventanas de Inscripción ---
  getVentanas: protectedProcedure.query(() => InscripcionesService.getVentanas()),

  createVentana: protectedProcedure
    .input(createVentanaInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.createVentana(input)),

  updateVentana: protectedProcedure
    .input(updateVentanaInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.updateVentana(input)),

  deleteVentana: protectedProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deleteVentana(input)),

  // --- Inscripciones de Alumnos ---
  getInscripciones: protectedProcedure
    .input(z.object({
      cicloId: z.number().int().positive().optional()
    }).optional())
    .query(({ input }) => InscripcionesService.getInscripciones(input?.cicloId)),

  createInscripcion: protectedProcedure
    .input(createInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.createInscripcion(input)),

  updateInscripcion: protectedProcedure
    .input(updateInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.updateInscripcion(input)),

  deleteInscripcion: protectedProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deleteInscripcion(input))
});
