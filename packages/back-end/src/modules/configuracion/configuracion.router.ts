import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { updateConfigSchema, createConfiguracionRecargoSchema, updateConfiguracionRecargoSchema } from './configuracion.schema';
import { ConfiguracionService } from './configuracion.service';

const lectura = protectedProcedure.use(hasModulePermission('Configuracion', false));
const escritura = protectedProcedure.use(hasModulePermission('Configuracion', true));

export const configuracionRouter = router({
  get: lectura
    .query(async () => {
      return ConfiguracionService.getConfiguracion();
    }),

  update: escritura
    .input(updateConfigSchema)
    .mutation(async ({ input }) => {
      return ConfiguracionService.updateConfiguracion(input);
    }),

  getRecargos: lectura
    .query(async () => {
      return ConfiguracionService.getRecargos();
    }),
    
  createRecargo: escritura
    .input(createConfiguracionRecargoSchema)
    .mutation(async ({ input }) => {
      return ConfiguracionService.createRecargo(input);
    }),

  updateRecargo: escritura
    .input(updateConfiguracionRecargoSchema)
    .mutation(async ({ input }) => {
      return ConfiguracionService.updateRecargo(input);
    }),

  sincronizarRecargos: escritura
    .mutation(async () => {
      return ConfiguracionService.sincronizarRecargosRetroactivos();
    }),

  getServerNetworkInfo: lectura
    .query(async () => {
      return ConfiguracionService.getServerNetworkInfo();
    }),
});
