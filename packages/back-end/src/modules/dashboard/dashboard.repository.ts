import { prisma } from '@sga/data-access';

export class DashboardRepository {
  static async getAlumnosActivosCount() {
    return prisma.alumno.count({ where: { estado: 'ACTIVO' } });
  }

  static async getAlumnosBajaCount() {
    return prisma.alumno.count({ where: { estado: { in: ['BAJA_DEFINITIVA', 'BAJA_TEMPORAL'] } } });
  }

  static async getCuposMaximosPorNivel() {
    return prisma.grupo.groupBy({
      by: ['nivelId'],
      _sum: { cupoMaximo: true }
    });
  }

  static async getIngresosPagosSince(fechaInicio: Date) {
    return prisma.pago.aggregate({
      _sum: { montoTotal: true },
      where: { fechaPago: { gte: fechaInicio } }
    });
  }

  static async getDeudaPendienteTotal() {
    return prisma.calendarioPago.aggregate({
      _sum: { saldoPendiente: true },
      where: { estadoCobro: { in: ['PENDIENTE', 'VENCIDO'] } }
    });
  }
}
