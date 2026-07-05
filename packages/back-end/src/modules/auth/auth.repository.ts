import { prisma } from '@sga/data-access';

export class AuthRepository {
  static async findUsuarioByIdentifier(identificador: string) {
    return prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: identificador },
          { nombreUsuario: identificador }
        ]
      },
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        permisosModulos: true
      }
    });
  }

  static async registrarIntentoLogin(
    usuarioId: number | null,
    nombreUsuarioIntentado: string,
    exitoso: boolean,
    direccionIp: string,
    userAgent: string
  ) {
    return prisma.intentoLogin.create({
      data: {
        usuarioId,
        nombreUsuarioIntentado,
        exitoso,
        direccionIp,
        userAgent
      }
    });
  }

  static async updateUsuarioIntentos(usuarioId: number, intentosFallidos: number, bloqueadoHasta: Date | null) {
    return prisma.usuario.update({
      where: { usuarioId },
      data: { intentosFallidos, bloqueadoHasta }
    });
  }

  static async resetUsuarioIntentos(usuarioId: number) {
    return prisma.usuario.update({
      where: { usuarioId },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() }
    });
  }

  static async revocarToken(jti: string, usuarioId: number, expiraEn: Date) {
    return prisma.tokenRevocado.create({
      data: {
        jti,
        usuarioId,
        expiraEn
      }
    });
  }
}
