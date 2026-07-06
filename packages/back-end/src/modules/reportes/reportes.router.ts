import { router, gestorProcedure, docentProcedure } from '../../trpc';
import { ReporteFechasSchema, ReporteAsistenciaSchema } from './reportes.schemas';

export const reportesRouter = router({
  reporteDeudores: gestorProcedure
    .query(async ({ ctx }) => {
      // Obtenemos alumnos que tienen un calendario de pago vencido
      const deudores = await ctx.prisma.calendarioPago.findMany({
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

      // Mapeamos a un formato plano para tablas de exportación (Excel/CSV)
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
    }),

  reporteIngresos: gestorProcedure
    .input(ReporteFechasSchema)
    .query(async ({ input, ctx }) => {
      const pagos = await ctx.prisma.pago.findMany({
        where: {
          fechaPago: {
            gte: new Date(input.fechaInicio),
            lte: new Date(input.fechaFin),
          }
        },
        include: {
          alumno: true,
          tutor: true,
          registrador: { select: { nombreCompleto: true } }
        },
        orderBy: { fechaPago: 'asc' }
      });

      return pagos.map(p => ({
        pagoId: p.pagoId,
        fecha: p.fechaPago,
        alumno: p.alumno.nombreCompleto,
        tutor: p.tutor.nombreCompleto,
        metodo: p.metodoPago,
        montoTotal: Number(p.montoTotal),
        cajero: p.registrador.nombreCompleto,
      }));
    }),

  listaAsistencia: docentProcedure
    .input(ReporteAsistenciaSchema)
    .query(async ({ input, ctx }) => {
      let dateFilter = {};
      if (input.anio && input.mes) {
        const start = new Date(input.anio, input.mes - 1, 1);
        const end = new Date(input.anio, input.mes, 0); // último día
        dateFilter = { gte: start, lte: end };
      }

      // Obtener todos los alumnos del grupo
      const inscripciones = await ctx.prisma.inscripcionCiclo.findMany({
        where: { grupoId: input.grupoId, estadoEnCiclo: 'ACTIVO' },
        include: { alumno: true }
      });

      // Obtener asistencias del grupo
      const asistenciasRaw = await ctx.prisma.asistencia.findMany({
        where: {
          grupoMateria: { grupoId: input.grupoId },
          ...(Object.keys(dateFilter).length > 0 ? { fecha: dateFilter } : {})
        },
        orderBy: { fecha: 'asc' }
      });

      return {
        totalAlumnos: inscripciones.length,
        alumnos: inscripciones.map(i => i.alumno.nombreCompleto),
        registroDetallado: asistenciasRaw
      };
    })
});
