import { ReportesRepository } from './reportes.repository';
import type { ReporteFechasInput, ReporteAsistenciaInput } from './reportes.schemas';

export class ReportesService {
  static async getReporteDeudores() {
    const deudores = await ReportesRepository.getDeudores();

    return deudores.map(d => ({
      alumno: d.alumno.nombreCompleto,
      matricula: d.alumno.matricula,
      tutorPrincipal: d.alumno.tutoresAlumnos[0]?.tutor?.nombreCompleto || 'Sin tutor',
      telefonoTutor: d.alumno.tutoresAlumnos[0]?.tutor?.telefono || 'N/A',
      concepto: d.concepto,
      mes: d.mes,
      montoAdeudo: Number(d.saldoPendiente),
      diasAtraso: Math.floor((new Date().getTime() - d.fechaVencimiento.getTime()) / (1000 * 3600 * 24)),
    }));
  }

  static async getReporteIngresos(input: ReporteFechasInput) {
    const pagos = await ReportesRepository.getPagosByDate(new Date(input.fechaInicio), new Date(input.fechaFin));

    return pagos.map(p => ({
      pagoId: p.pagoId,
      fecha: p.fechaPago,
      alumno: p.alumno.nombreCompleto,
      tutor: p.tutor.nombreCompleto,
      metodo: p.metodoPago,
      montoTotal: Number(p.montoTotal),
      cajero: p.registrador.nombreCompleto,
    }));
  }

  static async getListaAsistencia(input: ReporteAsistenciaInput) {
    let dateFilter = {};
    if (input.anio && input.mes) {
      const start = new Date(input.anio, input.mes - 1, 1);
      const end = new Date(input.anio, input.mes, 0); // último día
      dateFilter = { gte: start, lte: end };
    }

    const inscripciones = await ReportesRepository.getInscripcionesActivas(input.grupoId);
    const asistenciasRaw = await ReportesRepository.getAsistenciasRaw(input.grupoId, dateFilter);

    return {
      totalAlumnos: inscripciones.length,
      alumnos: inscripciones.map(i => i.alumno.nombreCompleto),
      registroDetallado: asistenciasRaw
    };
  }
}
