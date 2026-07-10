import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { z } from 'zod';
import { InscripcionesService } from './inscripciones.service';
import { 
  createPlanPagoSchema, updatePlanPagoSchema, 
  createVentanaInscripcionSchema, updateVentanaInscripcionSchema, 
  createInscripcionSchema, updateInscripcionSchema,
  asignarPlanPagoSchema, quitarPlanPagoSchema, getTarifaColegiaturaSchema
} from './inscripciones.schema';

const lectura = protectedProcedure.use(hasModulePermission('Alumnos', false));
const escritura = protectedProcedure.use(hasModulePermission('Alumnos', true));

export const inscripcionesRouter = router({
  
  // --- Planes de Pago ---
  getPlanesPago: lectura.query(() => InscripcionesService.getPlanesPago()),

  createPlanPago: escritura
    .input(createPlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.createPlanPago(input)),

  updatePlanPago: escritura
    .input(updatePlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.updatePlanPago(input)),

  deletePlanPago: escritura
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deletePlanPago(input)),

  // --- Ventanas de Inscripción ---
  getVentanas: lectura.query(() => InscripcionesService.getVentanas()),

  createVentana: escritura
    .input(createVentanaInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.createVentana(input)),

  updateVentana: escritura
    .input(updateVentanaInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.updateVentana(input)),

  deleteVentana: escritura
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deleteVentana(input)),

  // --- Inscripciones de Alumnos ---
  getInscripciones: lectura
    .input(z.object({
      cicloId: z.number().int().positive().optional()
    }).optional())
    .query(({ input }) => InscripcionesService.getInscripciones(input?.cicloId)),

  createInscripcion: escritura
    .input(createInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.createInscripcion(input)),

  updateInscripcion: escritura
    .input(updateInscripcionSchema)
    .mutation(({ input }) => InscripcionesService.updateInscripcion(input)),

  deleteInscripcion: escritura
    .input(z.number().int().positive())
    .mutation(({ input }) => InscripcionesService.deleteInscripcion(input)),

  asignarPlanPago: escritura
    .input(asignarPlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.asignarPlanPago(input)),

  quitarPlanPago: escritura
    .input(quitarPlanPagoSchema)
    .mutation(({ input }) => InscripcionesService.quitarPlanPago(input)),

  getTarifaColegiatura: lectura
    .input(getTarifaColegiaturaSchema)
    .query(({ input }) => InscripcionesService.getTarifaColegiatura(input))
});
