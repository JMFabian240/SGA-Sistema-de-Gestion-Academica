import { router, adminProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { 
  ListarUsuariosSchema, 
  CrearUsuarioSchema, 
  ActualizarEstadoUsuarioSchema, 
  AsignarRolesSchema 
} from './usuarios.schemas';

export const usuariosRouter = router({
  getRoles: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.rol.findMany({
      where: { eliminadoEn: null },
      orderBy: { nombre: 'asc' },
    });
  }),

  listarUsuarios: adminProcedure
    .input(ListarUsuariosSchema)
    .query(async ({ input, ctx }) => {
      const skip = (input.pagina - 1) * input.limite;

      const whereClause = input.busqueda ? {
        OR: [
          { nombreUsuario: { contains: input.busqueda, mode: 'insensitive' as const } },
          { nombreCompleto: { contains: input.busqueda, mode: 'insensitive' as const } },
          { correo: { contains: input.busqueda, mode: 'insensitive' as const } },
        ]
      } : {};

      const [total, usuarios] = await Promise.all([
        ctx.prisma.usuario.count({ where: whereClause }),
        ctx.prisma.usuario.findMany({
          where: whereClause,
          skip,
          take: input.limite,
          select: {
            usuarioId: true,
            nombreUsuario: true,
            nombreCompleto: true,
            correo: true,
            activo: true,
            roles: {
              include: { rol: true }
            }
          },
          orderBy: { usuarioId: 'desc' },
        }),
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
    }),

  crearUsuario: adminProcedure
    .input(CrearUsuarioSchema)
    .mutation(async ({ input, ctx }) => {
      // 1. Verificar correo / usuario único
      const existente = await ctx.prisma.usuario.findFirst({
        where: {
          OR: [
            { nombreUsuario: input.nombreUsuario },
            { correo: input.correo },
          ]
        }
      });

      if (existente) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'El nombre de usuario o correo ya está registrado',
        });
      }

      // Hashear la contraseña usando bcrypt
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // 2. Crear usuario y asignar roles transaccionalmente
      const nuevoUsuario = await ctx.prisma.$transaction(async (tx) => {
        const u = await tx.usuario.create({
          data: {
            nombreUsuario: input.nombreUsuario,
            nombreCompleto: input.nombreCompleto,
            correo: input.correo,
            telefono: input.telefono,
            passwordHash: hashedPassword,
            debeCambiarPwd: true,
          }
        });

        // Asignar roles
        const userRolesData = input.roles.map(rolId => ({
          usuarioId: u.usuarioId,
          rolId,
          asignadoPor: ctx.user.usuarioId,
        }));

        await tx.usuarioRol.createMany({ data: userRolesData });

        return u;
      });

      return { success: true, usuarioId: nuevoUsuario.usuarioId };
    }),

  actualizarEstadoUsuario: adminProcedure
    .input(ActualizarEstadoUsuarioSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.usuarioId === ctx.user.usuarioId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No puedes desactivar tu propia cuenta',
        });
      }

      const actualizado = await ctx.prisma.usuario.update({
        where: { usuarioId: input.usuarioId },
        data: { activo: input.activo },
      });

      return { success: true, activo: actualizado.activo };
    }),

  asignarRoles: adminProcedure
    .input(AsignarRolesSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.$transaction(async (tx) => {
        // Borrar roles actuales
        await tx.usuarioRol.deleteMany({
          where: { usuarioId: input.usuarioId }
        });

        // Insertar nuevos
        const userRolesData = input.roles.map(rolId => ({
          usuarioId: input.usuarioId,
          rolId,
          asignadoPor: ctx.user.usuarioId,
        }));

        await tx.usuarioRol.createMany({ data: userRolesData });
      });

      return { success: true };
    }),
});
