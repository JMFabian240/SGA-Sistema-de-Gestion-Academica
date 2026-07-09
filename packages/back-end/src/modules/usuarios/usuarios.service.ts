import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { UsuariosRepository } from './usuarios.repository';
import type { Prisma } from '@sga/data-access';
import type { 
  ListarUsuariosInput, 
  CrearUsuarioInput, 
  ActualizarEstadoUsuarioInput, 
  AsignarRolesInput,
  ActualizarPasswordInput,
  PermisosModuloInput
} from './usuarios.schemas';
import { getDefaultPermissions } from './usuarios.defaults';

export class UsuariosService {
  static async getRoles() {
    return UsuariosRepository.getRoles();
  }

  static async listarUsuarios(input: ListarUsuariosInput) {
    const skip = (input.pagina - 1) * input.limite;

    const whereClause: Prisma.UsuarioWhereInput = input.busqueda ? {
      OR: [
        { nombreUsuario: { contains: input.busqueda, mode: 'insensitive' as const } },
        { nombreCompleto: { contains: input.busqueda, mode: 'insensitive' as const } },
      ]
    } : {};

    const [total, usuarios] = await Promise.all([
      UsuariosRepository.countUsuarios(whereClause),
      UsuariosRepository.findUsuarios(whereClause, skip, input.limite),
    ]);

    return {
      data: usuarios,
      meta: {
        total,
        pagina: input.pagina,
        limite: input.limite,
        totalPaginas: Math.ceil(total / input.limite),
      }
    };
  }

  static async crearUsuario(input: CrearUsuarioInput, actorId: number) {
    const existente = await UsuariosRepository.findByUsername(input.nombreUsuario);

    if (existente) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'El nombre de usuario ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const usuarioData = {
      nombreUsuario: input.nombreUsuario,
      nombreCompleto: input.nombreCompleto,
      passwordHash: hashedPassword,
      debeCambiarPwd: true,
    } as any;

    const nuevoUsuario = await UsuariosRepository.createUsuarioWithRoles(usuarioData, [input.rolId], actorId);

    // Asignar permisos por defecto basados en los roles seleccionados
    const rolesDisponibles = await UsuariosRepository.getRoles();
    const codigosRoles = rolesDisponibles
      .filter(r => r.rolId === input.rolId)
      .map(r => r.codigo);
    
    const permisosPorDefecto = getDefaultPermissions(codigosRoles);
    await UsuariosRepository.sincronizarPermisosModulo(nuevoUsuario.usuarioId, permisosPorDefecto);

    return { success: true, usuarioId: nuevoUsuario.usuarioId };
  }

  static async actualizarEstadoUsuario(input: ActualizarEstadoUsuarioInput, actorId: number) {
    if (input.usuarioId === actorId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No puedes desactivar tu propia cuenta',
      });
    }

    const actualizado = await UsuariosRepository.updateEstado(input.usuarioId, input.activo);

    return { success: true, activo: actualizado.activo };
  }

  static async asignarRoles(input: AsignarRolesInput, actorId: number) {
    await UsuariosRepository.replaceRoles(input.usuarioId, input.roles, actorId);

    // Sincronizar permisos por defecto cuando cambian los roles
    const rolesDisponibles = await UsuariosRepository.getRoles();
    const codigosRoles = rolesDisponibles
      .filter(r => input.roles.includes(r.rolId))
      .map(r => r.codigo);
    
    const permisosPorDefecto = getDefaultPermissions(codigosRoles);
    await UsuariosRepository.sincronizarPermisosModulo(input.usuarioId, permisosPorDefecto);

    return { success: true };
  }

  static async obtenerUsuarioDetalle(usuarioId: number) {
    const usuario = await UsuariosRepository.findById(usuarioId);
    if (!usuario) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado',
      });
    }
    return usuario;
  }

  static async actualizarPasswordUsuario(input: ActualizarPasswordInput) {
    const hashedPassword = await bcrypt.hash(input.nuevaPassword, 10);
    await UsuariosRepository.updatePassword(input.usuarioId, hashedPassword);
    return { success: true };
  }

  static async sincronizarPermisosModulo(input: PermisosModuloInput) {
    const permisosMap = input.permisos.map(p => ({
      modulo: p.modulo as string,
      nivel: p.nivel
    }));
    await UsuariosRepository.sincronizarPermisosModulo(input.usuarioId, permisosMap);
    return { success: true };
  }
}
