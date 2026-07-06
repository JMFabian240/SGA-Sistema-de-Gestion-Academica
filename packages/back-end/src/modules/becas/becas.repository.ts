import { prisma, Prisma } from '@sga/data-access';

export class BecasRepository {
  static async getBecasActivas() {
    return prisma.beca.findMany({
      where: { eliminadoEn: null },
      orderBy: { nombreBeca: 'asc' }
    });
  }

  static async createBeca(data: Prisma.BecaCreateInput) {
    return prisma.beca.create({ data });
  }

  static async updateBeca(becaId: number, data: Prisma.BecaUpdateInput) {
    return prisma.beca.update({
      where: { becaId },
      data
    });
  }

  static async deleteBeca(becaId: number) {
    return prisma.beca.update({
      where: { becaId },
      data: { eliminadoEn: new Date() }
    });
  }

  static async getSolicitudes(cicloId?: number, alumnoId?: number) {
    return prisma.solicitudBeca.findMany({
      where: {
        eliminadoEn: null,
        ...(cicloId && { cicloId }),
        ...(alumnoId && { alumnoId })
      },
      include: {
        alumno: true,
        beca: true,
        ciclo: true,
        solicitador: true,
        resolvedor: true
      },
      orderBy: { fechaSolicitud: 'desc' }
    });
  }

  static async findSolicitudActiva(alumnoId: number, becaId: number, cicloId: number) {
    return prisma.solicitudBeca.findFirst({
      where: {
        alumnoId,
        becaId,
        cicloId,
        estado: 'ACTIVA',
        eliminadoEn: null
      }
    });
  }

  static async createSolicitud(data: Prisma.SolicitudBecaUncheckedCreateInput) {
    return prisma.solicitudBeca.create({
      data,
      include: {
        beca: true,
        alumno: true
      }
    });
  }

  static async findSolicitudById(solicitudId: number) {
    return prisma.solicitudBeca.findUnique({
      where: { solicitudId }
    });
  }

  static async resolverSolicitudConAsignacion(
    solicitudId: number,
    solicitudData: Prisma.SolicitudBecaUncheckedUpdateInput,
    aprobar: boolean,
    asignacionData?: Prisma.AsignacionBecaUncheckedCreateInput
  ) {
    return prisma.$transaction(async (tx) => {
      const solicitudResuelta = await tx.solicitudBeca.update({
        where: { solicitudId },
        data: solicitudData
      });

      let asignacion = null;
      if (aprobar && asignacionData) {
        asignacion = await tx.asignacionBeca.create({
          data: asignacionData
        });
      }

      return { solicitud: solicitudResuelta, asignacion };
    });
  }

  static async assignBecaDirectamente(data: Prisma.AsignacionBecaUncheckedCreateInput) {
    return prisma.asignacionBeca.create({
      data,
      include: {
        beca: true
      }
    });
  }
}
