import { DashboardRepository } from './dashboard.repository';

export class DashboardService {
  static async obtenerMetricasInscripcion() {
    const [alumnosActivos, alumnosBaja, cuposPorNivel] = await Promise.all([
      DashboardRepository.getAlumnosActivosCount(),
      DashboardRepository.getAlumnosBajaCount(),
      DashboardRepository.getCuposMaximosPorNivel(),
    ]);

    return {
      alumnosActivos,
      alumnosBaja,
      cuposTotales: cuposPorNivel.reduce((acc, curr) => acc + (curr._sum.cupoMaximo || 0), 0),
      detallesNivel: cuposPorNivel
    };
  }

  static async obtenerKpisFinancieros() {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [sumaIngresos, sumaDeudaPendiente] = await Promise.all([
      DashboardRepository.getIngresosPagosSince(inicioMes),
      DashboardRepository.getDeudaPendienteTotal()
    ]);

    return {
      ingresosMesActual: sumaIngresos._sum.montoTotal || 0,
      deudaPendienteTotal: sumaDeudaPendiente._sum.saldoPendiente || 0,
    };
  }
}
