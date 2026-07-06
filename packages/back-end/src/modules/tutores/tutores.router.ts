import { router, docentProcedure, gestorProcedure } from '../../trpc';
import { z } from 'zod';
import { TutoresService } from './tutores.service';
import { createTutorSchema, updateTutorSchema } from './tutores.schema';

export const tutoresRouter = router({
  /**
   * Listar todos los tutores activos.
   */
  getAll: docentProcedure.query(() => {
    return TutoresService.getTutores();
  }),

  /**
   * Obtener detalle de un tutor específico por su ID.
   */
  getById: docentProcedure
    .input(z.number().int().positive())
    .query(({ input }) => {
      return TutoresService.getTutorById(input);
    }),

  /**
   * Crear un nuevo tutor (y opcionalmente sus datos fiscales).
   */
  create: gestorProcedure
    .input(createTutorSchema)
    .mutation(({ input }) => {
      return TutoresService.createTutor(input);
    }),

  /**
   * Actualizar un tutor existente.
   */
  update: gestorProcedure
    .input(updateTutorSchema)
    .mutation(({ input }) => {
      return TutoresService.updateTutor(input);
    }),

  /**
   * Eliminar un tutor (Soft Delete).
   */
  delete: gestorProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => {
      return TutoresService.deleteTutor(input);
    }),
});
