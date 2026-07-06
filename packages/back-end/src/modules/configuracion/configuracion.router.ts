import { router, gestorProcedure, adminProcedure } from '../../trpc';
import { updateConfigSchema } from './configuracion.schema';
import { ConfiguracionService } from './configuracion.service';

export const configuracionRouter = router({
  /**
   * Obtener la configuración global del sistema
   */
  get: gestorProcedure
    .query(async () => {
      return ConfiguracionService.getConfiguracion();
    }),

  /**
   * Actualizar la configuración global del sistema
   */
  update: adminProcedure
    .input(updateConfigSchema)
    .mutation(async ({ input }) => {
      return ConfiguracionService.updateConfiguracion(input);
    })
});
