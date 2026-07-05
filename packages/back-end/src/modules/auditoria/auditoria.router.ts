import { router, protectedProcedure } from '../../trpc';
import { ObtenerLogsSchema } from './auditoria.schemas';
import { AuditoriaService } from './auditoria.service';

export const auditoriaRouter = router({
  obtenerLogs: protectedProcedure
    .input(ObtenerLogsSchema)
    .query(async ({ input }) => {
      return AuditoriaService.obtenerLogs(input);
    }),
});
