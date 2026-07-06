import { router, adminProcedure } from '../../trpc';
import { 
  ListarUsuariosSchema, 
  CrearUsuarioSchema, 
  ActualizarEstadoUsuarioSchema, 
  AsignarRolesSchema 
} from './usuarios.schemas';
import { UsuariosService } from './usuarios.service';

export const usuariosRouter = router({
  getRoles: adminProcedure.query(async () => {
    return UsuariosService.getRoles();
  }),

  listarUsuarios: adminProcedure
    .input(ListarUsuariosSchema)
    .query(async ({ input }) => {
      return UsuariosService.listarUsuarios(input);
    }),

  crearUsuario: adminProcedure
    .input(CrearUsuarioSchema)
    .mutation(async ({ input, ctx }) => {
      return UsuariosService.crearUsuario(input, (ctx as any).user.usuarioId);
    }),

  actualizarEstadoUsuario: adminProcedure
    .input(ActualizarEstadoUsuarioSchema)
    .mutation(async ({ input, ctx }) => {
      return UsuariosService.actualizarEstadoUsuario(input, (ctx as any).user.usuarioId);
    }),

  asignarRoles: adminProcedure
    .input(AsignarRolesSchema)
    .mutation(async ({ input, ctx }) => {
      return UsuariosService.asignarRoles(input, (ctx as any).user.usuarioId);
    }),
});
