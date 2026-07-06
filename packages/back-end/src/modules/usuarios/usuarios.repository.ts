import { prisma, Prisma } from '@sga/data-access';

export class UsuariosRepository {
  static async getRoles() {
    return prisma.rol.findMany({
      where: { eliminadoEn: null },
      orderBy: { nombre: 'asc' },
    });
  }

  static async countUsuarios(whereClause: Prisma.UsuarioWhereInput) {
    return prisma.usuario.count({ where: whereClause });
  }

  static async findUsuarios(whereClause: Prisma.UsuarioWhereInput, skip: number, take: number) {
    return prisma.usuario.findMany({
      where: whereClause,
      skip,
      take,
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
    });
  }

  static async findByUsernameOrEmail(nombreUsuario: string, correo: string) {
    return prisma.usuario.findFirst({
      where: {
        OR: [
          { nombreUsuario },
          { correo },
        ]
      }
    });
  }

  static async createUsuarioWithRoles(
    usuarioData: Prisma.UsuarioCreateInput, 
    rolesIds: number[], 
    asignadoPor: number
  ) {
    return prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: usuarioData
      });

      const userRolesData = rolesIds.map(rolId => ({
        usuarioId: u.usuarioId,
        rolId,
        asignadoPor,
      }));

      if (userRolesData.length > 0) {
        await tx.usuarioRol.createMany({ data: userRolesData });
      }

      return u;
    });
  }

  static async updateEstado(usuarioId: number, activo: boolean) {
    return prisma.usuario.update({
      where: { usuarioId },
      data: { activo },
    });
  }

  static async replaceRoles(usuarioId: number, rolesIds: number[], asignadoPor: number) {
    return prisma.$transaction(async (tx) => {
      await tx.usuarioRol.deleteMany({
        where: { usuarioId }
      });

      const userRolesData = rolesIds.map(rolId => ({
        usuarioId,
        rolId,
        asignadoPor,
      }));

      if (userRolesData.length > 0) {
        await tx.usuarioRol.createMany({ data: userRolesData });
      }
    });
  }
}
