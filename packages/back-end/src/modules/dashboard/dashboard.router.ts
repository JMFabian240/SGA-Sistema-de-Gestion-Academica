import { router, gestorProcedure } from '../../trpc';

export const dashboardRouter = router({
  obtenerMetricasInscripcion: gestorProcedure
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

  obtenerKpisFinancieros: gestorProcedure
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
        ingresosMesActual: Number(sumaIngresos._sum.montoTotal || 0),
        deudaPendienteTotal: Number(sumaDeudaPendiente._sum.saldoPendiente || 0),
      };
    }),

  obtenerIngresosUltimos7Dias: gestorProcedure
    .query(async ({ ctx }) => {
      // 1. Obtener la fecha de inicio (hace 6 días a partir de hoy a las 00:00 local)
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 6);
      hace7Dias.setHours(0, 0, 0, 0);

      // 2. Consultar pagos desde hace 7 días
      const pagos = await ctx.prisma.pago.findMany({
        where: {
          fechaPago: {
            gte: hace7Dias
          }
        },
        select: {
          fechaPago: true,
          montoTotal: true
        }
      });

      // 3. Inicializar el listado de los últimos 7 días con ingresos en 0
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const chartData: { day: string; fechaStr: string; ingresos: number }[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        
        // Formato local YYYY-MM-DD
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;

        chartData.push({
          day: diasSemana[d.getDay()],
          fechaStr,
          ingresos: 0
        });
      }

      // 4. Sumar ingresos mapeándolos por su fecha YYYY-MM-DD
      for (const p of pagos) {
        // Extraer partes UTC de la fecha cargada por Prisma para obtener exactamente la fecha guardada
        const yyyy = p.fechaPago.getUTCFullYear();
        const mm = String(p.fechaPago.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(p.fechaPago.getUTCDate()).padStart(2, '0');
        const fechaPagoStr = `${yyyy}-${mm}-${dd}`;

        const diaCoincidente = chartData.find(item => item.fechaStr === fechaPagoStr);
        if (diaCoincidente) {
          diaCoincidente.ingresos = Math.round((diaCoincidente.ingresos + Number(p.montoTotal)) * 100) / 100;
        }
      }

      // 5. Retornar los datos limpios para el gráfico
      return chartData.map(item => ({
        day: item.day,
        ingresos: item.ingresos
      }));
    }),
});
