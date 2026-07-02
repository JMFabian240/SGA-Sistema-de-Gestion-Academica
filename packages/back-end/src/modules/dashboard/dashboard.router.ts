import { router, protectedProcedure } from '../../trpc';

export const dashboardRouter = router({
  obtenerMetricasInscripcion: protectedProcedure
    .query(async ({ ctx }) => {
      const [alumnosActivos, alumnosBaja, cuposPorNivel] = await Promise.all([
        ctx.prisma.alumno.count({ where: { estado: 'ACTIVO' } }),
        ctx.prisma.alumno.count({ where: { estado: { in: ['BAJA_DEFINITIVA', 'BAJA_TEMPORAL'] } } }),
        ctx.prisma.grupo.groupBy({
          by: ['nivelId'],
          _sum: { cupoMaximo: true }
        }),
      ]);

      return {
        alumnosActivos,
        alumnosBaja,
        cuposTotales: cuposPorNivel.reduce((acc, curr) => acc + (curr._sum.cupoMaximo || 0), 0),
        detallesNivel: cuposPorNivel
      };
    }),

  obtenerKpisFinancieros: protectedProcedure
    .query(async ({ ctx }) => {
      // Ingresos del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const [sumaIngresos, sumaDeudaPendiente] = await Promise.all([
        ctx.prisma.pago.aggregate({
          _sum: { montoTotal: true },
          where: { fechaPago: { gte: inicioMes } }
        }),
        ctx.prisma.calendarioPago.aggregate({
          _sum: { saldoPendiente: true },
          where: { estadoCobro: { in: ['PENDIENTE', 'VENCIDO'] } }
        })
      ]);

      return {
        ingresosMesActual: sumaIngresos._sum.montoTotal || 0,
        deudaPendienteTotal: sumaDeudaPendiente._sum.saldoPendiente || 0,
      };
    }),
});
