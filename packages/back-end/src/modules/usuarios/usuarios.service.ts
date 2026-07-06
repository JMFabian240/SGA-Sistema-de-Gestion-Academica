import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { UsuariosRepository } from './usuarios.repository';
import type { Prisma } from '@sga/data-access';
import type { ListarUsuariosInput, CrearUsuarioInput, ActualizarEstadoUsuarioInput, AsignarRolesInput } from './usuarios.schemas';

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
        { correo: { contains: input.busqueda, mode: 'insensitive' as const } },
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
    const existente = await UsuariosRepository.findByUsernameOrEmail(input.nombreUsuario, input.correo);

    if (existente) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'El nombre de usuario o correo ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const usuarioData = {
      nombreUsuario: input.nombreUsuario,
      nombreCompleto: input.nombreCompleto,
      correo: input.correo,
      telefono: input.telefono,
      passwordHash: hashedPassword,
      debeCambiarPwd: true,
    };

    const nuevoUsuario = await UsuariosRepository.createUsuarioWithRoles(usuarioData, input.roles, actorId);

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
    return { success: true };
  }
}
