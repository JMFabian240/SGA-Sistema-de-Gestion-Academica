import { prisma } from '@sga/data-access';

export class ReportesRepository {
  static async getDeudores() {
    return prisma.calendarioPago.findMany({
      where: { estadoCobro: 'VENCIDO' },
      include: {
        alumno: {
          include: {
            tutoresAlumnos: {
              where: { esPrincipal: true },
              include: { tutor: true }
            }
          }
        },
        ciclo: true,
      },
      orderBy: { fechaVencimiento: 'asc' }
    });
  }

  static async getPagosByDate(fechaInicio: Date, fechaFin: Date) {
    return prisma.pago.findMany({
      where: {
        fechaPago: {
          gte: fechaInicio,
          lte: fechaFin,
        }
      },
      include: {
        alumno: true,
        tutor: true,
        registrador: { select: { nombreCompleto: true } }
      },
      orderBy: { fechaPago: 'asc' }
    });
  }

  static async getInscripcionesActivas(grupoId: number) {
    return prisma.inscripcionCiclo.findMany({
      where: { grupoId, estadoEnCiclo: 'ACTIVO' },
      include: { alumno: true }
    });
  }

  static async getAsistenciasRaw(grupoId: number, dateFilter: any) {
    return prisma.asistencia.findMany({
      where: {
        grupoMateria: { grupoId },
        ...(Object.keys(dateFilter).length > 0 ? { fecha: dateFilter } : {})
      },
      orderBy: { fecha: 'asc' }
    });
  }
}
