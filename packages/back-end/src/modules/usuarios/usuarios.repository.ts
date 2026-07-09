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
        activo: true,
        roles: {
          include: { rol: true }
        }
      },
      orderBy: { usuarioId: 'desc' },
    });
  }

  static async findByUsername(nombreUsuario: string) {
    return prisma.usuario.findFirst({
      where: {
        nombreUsuario
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

  static async findById(usuarioId: number) {
    return prisma.usuario.findUnique({
      where: { usuarioId },
      select: {
        usuarioId: true,
        nombreUsuario: true,
        nombreCompleto: true,
        telefono: true,
        activo: true,
        ultimoAcceso: true,
        creadoEn: true,
        roles: {
          include: { rol: true }
        },
        permisosModulos: {
          select: {
            modulo: true,
            nivel: true
          }
        }
      }
    });
  }

  static async updatePassword(usuarioId: number, passwordHash: string) {
    return prisma.usuario.update({
      where: { usuarioId },
      data: { passwordHash }
    });
  }

  static async sincronizarPermisosModulo(usuarioId: number, permisos: { modulo: string, nivel: any }[]) {
    return prisma.$transaction(async (tx) => {
      // Eliminar todos los permisos actuales
      await tx.usuarioPermisoModulo.deleteMany({
        where: { usuarioId }
      });

      // Crear los nuevos permisos
      if (permisos.length > 0) {
        await tx.usuarioPermisoModulo.createMany({
          data: permisos.map(p => ({
            usuarioId,
            modulo: p.modulo,
            nivel: p.nivel,
            activo: true
          }))
        });
      }
    });
  }
}
