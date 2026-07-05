import { prisma, Prisma } from '@sga/data-access';

export class AuditoriaRepository {
  static async countLogs(whereClause: Prisma.LogAuditoriaWhereInput) {
    return prisma.logAuditoria.count({ where: whereClause });
  }

  static async findLogs(whereClause: Prisma.LogAuditoriaWhereInput, skip: number, take: number) {
    return prisma.logAuditoria.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { fechaHora: 'desc' },
      include: {
        usuario: {
          select: {
            nombreUsuario: true,
            nombreCompleto: true,
          }
        }
      }
    });
  }
}
