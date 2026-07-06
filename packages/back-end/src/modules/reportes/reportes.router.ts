import { router, gestorProcedure, docentProcedure } from '../../trpc';
import { ReporteFechasSchema, ReporteAsistenciaSchema } from './reportes.schemas';
import { ReportesService } from './reportes.service';

export const reportesRouter = router({
  reporteDeudores: gestorProcedure
    .query(async () => {
      return ReportesService.getReporteDeudores();
    }),

  reporteIngresos: gestorProcedure
    .input(ReporteFechasSchema)
    .query(async ({ input }) => {
      return ReportesService.getReporteIngresos(input);
    }),

  listaAsistencia: docentProcedure
    .input(ReporteAsistenciaSchema)
    .query(async ({ input }) => {
      return ReportesService.getListaAsistencia(input);
    })
});
