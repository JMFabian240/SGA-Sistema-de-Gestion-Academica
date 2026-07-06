import { router, gestorProcedure } from '../../trpc';
import { z } from 'zod';
import { InscripcionesService } from './inscripciones.service';
import { 
  createPlanPagoSchema, updatePlanPagoSchema, 
  createVentanaInscripcionSchema, updateVentanaInscripcionSchema, 
  createInscripcionSchema, updateInscripcionSchema 
} from './inscripciones.schema';

export const inscripcionesRouter = router({
  
  // --- Planes de Pago ---
  getPlanesPago: gestorProcedure.query(() => InscripcionesService.getPlanesPago()),

  createPlanPago: gestorProcedure
    .input(createPlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.createPlanPago(input)),

  updatePlanPago: gestorProcedure
    .input(updatePlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.updatePlanPago(input)),

  deletePlanPago: gestorProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deletePlanPago(input)),

  // --- Ventanas de Inscripción ---
  getVentanas: gestorProcedure.query(() => InscripcionesService.getVentanas()),

  createVentana: gestorProcedure
    .input(createVentanaInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.createVentana(input)),

  updateVentana: gestorProcedure
    .input(updateVentanaInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.updateVentana(input)),

  deleteVentana: gestorProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deleteVentana(input)),

  // --- Inscripciones de Alumnos ---
  getInscripciones: gestorProcedure
    .input(z.object({
      cicloId: z.number().int().positive().optional()
    }).optional())
    .query(({ input }) => InscripcionesService.getInscripciones(input?.cicloId)),

  createInscripcion: gestorProcedure
    .input(createInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.createInscripcion(input)),

  updateInscripcion: gestorProcedure
    .input(updateInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.updateInscripcion(input)),

  deleteInscripcion: gestorProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deleteInscripcion(input))
});
