import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { z } from 'zod';
import { 
  ListarUsuariosSchema, 
  CrearUsuarioSchema, 
  ActualizarEstadoUsuarioSchema, 
  AsignarRolesSchema,
  ActualizarPasswordSchema,
  PermisosModuloSchema
} from './usuarios.schemas';
import { UsuariosService } from './usuarios.service';

const lecturaProcedure = protectedProcedure.use(hasModulePermission('Usuarios', false));
const escrituraProcedure = protectedProcedure.use(hasModulePermission('Usuarios', true));

export const usuariosRouter = router({
  getRoles: lecturaProcedure.query(async () => {
    return UsuariosService.getRoles();
  }),

  obtenerUsuarioDetalle: lecturaProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return UsuariosService.obtenerUsuarioDetalle(input);
    }),

  listarUsuarios: lecturaProcedure
    .input(ListarUsuariosSchema)
    .query(async ({ input }) => {
      return UsuariosService.listarUsuarios(input);
    }),

  crearUsuario: escrituraProcedure
    .input(CrearUsuarioSchema)
    .mutation(async ({ input, ctx }) => {
      return UsuariosService.crearUsuario(input, (ctx as any).user.usuarioId);
    }),

  actualizarEstadoUsuario: escrituraProcedure
    .input(ActualizarEstadoUsuarioSchema)
    .mutation(async ({ input, ctx }) => {
      return UsuariosService.actualizarEstadoUsuario(input, (ctx as any).user.usuarioId);
    }),

  asignarRoles: escrituraProcedure
    .input(AsignarRolesSchema)
    .mutation(async ({ input, ctx }) => {
      return UsuariosService.asignarRoles(input, (ctx as any).user.usuarioId);
    }),

  actualizarPasswordUsuario: escrituraProcedure
    .input(ActualizarPasswordSchema)
    .mutation(async ({ input }) => {
      return UsuariosService.actualizarPasswordUsuario(input);
    }),

  sincronizarPermisosModulo: escrituraProcedure
    .input(PermisosModuloSchema)
    .mutation(async ({ input }) => {
      return UsuariosService.sincronizarPermisosModulo(input);
    })
});
