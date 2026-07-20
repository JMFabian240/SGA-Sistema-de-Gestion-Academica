import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { z } from 'zod';
import { AlumnosService } from './alumnos.service';
import { createAlumnoSchema, updateAlumnoSchema, linkTutorSchema, unlinkTutorSchema } from './alumnos.schema';

const lectura = protectedProcedure.use(hasModulePermission('Alumnos', false));
const escritura = protectedProcedure.use(hasModulePermission('Alumnos', true));

export const alumnosRouter = router({
  /**
   * Obtener todos los alumnos
   */
  getAll: lectura.query(() => {
    return AlumnosService.getAlumnos();
  }),

  /**
   * Obtener detalle de un alumno por ID
   */
  getById: lectura
    .input(z.number().int().positive())
    .query(async ({ input }): Promise<any> => {
      return await AlumnosService.getAlumnoById(input);
    }),

  /**
   * Crear un nuevo alumno
   */
  create: escritura
    .input(createAlumnoSchema)
    .mutation(({ input }) => {
      return AlumnosService.createAlumno(input);
    }),

  /**
   * Actualizar un alumno existente
   */
  update: escritura
    .input(updateAlumnoSchema)
    .mutation(({ input }) => {
      return AlumnosService.updateAlumno(input);
    }),

  /**
   * Realizar Soft Delete de un alumno
   */
  delete: escritura
    .input(z.number().int().positive())
    .mutation(({ input }) => {
      return AlumnosService.deleteAlumno(input);
    }),

  /**
   * Vincular un tutor a un alumno
   */
  linkTutor: escritura
    .input(linkTutorSchema)
    .mutation(({ input }) => {
      return AlumnosService.linkTutor(input);
    }),

  /**
   * Desvincular un tutor de un alumno
   */
  unlinkTutor: escritura
    .input(unlinkTutorSchema)
    .mutation(({ input }) => {
      return AlumnosService.unlinkTutor(input);
    })
});
