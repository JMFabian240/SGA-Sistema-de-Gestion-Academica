import { router, docentProcedure } from '../../trpc';
import { CalificacionesService } from './calificaciones.service';
import { 
  getCalificacionesGrupoSchema, 
  getCalificacionesAlumnoSchema, 
  upsertCalificacionSchema, 
  deleteCalificacionSchema,
  GenerarBoletaSchema,
  KardexSchema
} from './calificaciones.schema';

export const calificacionesRouter = router({
  
  /**
   * Obtiene la boleta/registro de calificaciones para un grupo (vista docente)
   */
  getPorGrupo: docentProcedure
    .input(getCalificacionesGrupoSchema)
    .query(({ input }) => {
      return CalificacionesService.getCalificacionesGrupo(input);
    }),

  /**
   * Obtiene el kárdex completo de un alumno (vista administrativo/tutor)
   */
  getPorAlumno: docentProcedure
    .input(getCalificacionesAlumnoSchema)
    .query(({ input }) => {
      return CalificacionesService.getCalificacionesAlumno(input);
    }),

  /**
   * Inserta o actualiza una calificación de un alumno
   */
  upsert: docentProcedure
    .input(upsertCalificacionSchema)
    .mutation(({ input, ctx }) => {
      const registradorId = ctx.user?.usuarioId;
      if (!registradorId) throw new Error("No user in context");
      return CalificacionesService.upsertCalificacion(input, registradorId);
    }),

  /**
   * Elimina una calificación registrada por error
   */
  delete: docentProcedure
    .input(deleteCalificacionSchema)
    .mutation(({ input }) => {
      return CalificacionesService.deleteCalificacion(input);
    }),

  /**
   * Genera la boleta consolidada de un alumno en un ciclo escolar específico
   */
  generarBoletaCiclo: docentProcedure
    .input(GenerarBoletaSchema)
    .query(async ({ input, ctx }) => {
      const alumno = await ctx.prisma.alumno.findUnique({
        where: { alumnoId: input.alumnoId },
        include: { nivel: true }
      });
      const ciclo = await ctx.prisma.cicloEscolar.findUnique({
        where: { cicloId: input.cicloId }
      });

      const calificaciones = await ctx.prisma.calificacion.findMany({
        where: { 
          alumnoId: input.alumnoId, 
          grupoMateria: { grupo: { cicloId: input.cicloId } } 
        },
        include: {
          grupoMateria: { include: { materia: true } }
        }
      });

      return {
        alumno,
        ciclo,
        materias: calificaciones.map(c => ({
          materia: c.grupoMateria.materia.nombre,
          evaluacion: c.tipoEvaluacion,
          calificacion: c.valorNumerico || c.valorCualitativo,
        }))
      };
    }),

  /**
   * Obtiene el historial académico completo de todos los ciclos
   */
  obtenerKardexCompleto: docentProcedure
    .input(KardexSchema)
    .query(async ({ input, ctx }) => {
      const historial = await ctx.prisma.calificacion.findMany({
        where: { alumnoId: input.alumnoId },
        include: {
          grupoMateria: {
            include: {
              materia: true,
              grupo: { include: { ciclo: true, nivel: true } }
            }
          }
        },
        orderBy: { grupoMateria: { grupo: { ciclo: { fechaInicio: 'desc' } } } }
      });

      return historial.map(c => ({
        ciclo: c.grupoMateria.grupo.ciclo.nombre,
        nivel: c.grupoMateria.grupo.nivel.nombre,
        materia: c.grupoMateria.materia.nombre,
        calificacion: c.valorNumerico || c.valorCualitativo,
      }));
    })
});
