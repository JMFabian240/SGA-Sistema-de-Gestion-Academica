import { router, gestorProcedure } from '../../trpc';
import { DashboardService } from './dashboard.service';

export const dashboardRouter = router({
  obtenerMetricasInscripcion: gestorProcedure
    .query(async () => {
      return DashboardService.obtenerMetricasInscripcion();
    }),

  obtenerKpisFinancieros: gestorProcedure
    .query(async () => {
      const kpis = await DashboardService.obtenerKpisFinancieros();
      return {
        ingresosMesActual: Number(kpis.ingresosMesActual),
        deudaPendienteTotal: Number(kpis.deudaPendienteTotal)
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

  obtenerUltimosPagos: gestorProcedure
    .query(async ({ ctx }) => {
      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);

      const pagos = await ctx.prisma.pago.findMany({
        where: {
          fechaPago: {
            gte: inicioHoy
          }
        },
        include: {
          alumno: true,
          aplicacionesPago: {
            include: { calendarioPago: true }
          }
        },
        orderBy: {
          registradoEn: 'desc'
        },
        take: 5
      });

      return pagos.map(p => {
        const conceptos = Array.from(new Set(p.aplicacionesPago.map(a => a.calendarioPago?.concepto || 'Pago'))).join(', ');

        return {
          name: p.alumno.nombreCompleto,
          type: conceptos || 'Abono/Pago',
          amount: `$${Number(p.montoTotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        };
      });
    }),

  obtenerTopDeudores: gestorProcedure
    .query(async ({ ctx }) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // 1. Obtener todos los adeudos vencidos o pendientes con fecha de vencimiento menor a hoy
      const adeudosVencidos = await ctx.prisma.calendarioPago.findMany({
        where: { 
          OR: [
            { estadoCobro: 'VENCIDO' },
            { estadoCobro: 'PENDIENTE', fechaVencimiento: { lte: hoy } }
          ],
          eliminadoEn: null 
        },
        include: {
          alumno: {
            include: {
              tutoresAlumnos: {
                where: { esPrincipal: true },
                include: { tutor: true }
              }
            }
          }
        }
      });

      // 2. Agrupar por tutor
      const deudoresMap = new Map<number, { tutorId: number, nombreTutor: string, alumnoId: number, nombreAlumno: string, deudaMonto: number }>();

      for (const a of adeudosVencidos) {
        const relacionPrincipal = a.alumno.tutoresAlumnos[0];
        if (!relacionPrincipal?.tutor) continue;

        const { tutor } = relacionPrincipal;
        
        const current = deudoresMap.get(tutor.tutorId) || {
          tutorId: tutor.tutorId,
          nombreTutor: tutor.nombreCompleto,
          alumnoId: a.alumno.alumnoId,
          nombreAlumno: a.alumno.nombreCompleto,
          deudaMonto: 0
        };

        current.deudaMonto += Number(a.saldoPendiente);
        deudoresMap.set(tutor.tutorId, current);
      }

      // 3. Ordenar descendentemente por deuda y tomar el top 5
      const topDeudores = Array.from(deudoresMap.values())
        .sort((a, b) => b.deudaMonto - a.deudaMonto)
        .slice(0, 5);

      return topDeudores;
    }),

  obtenerCuentasPendientes: gestorProcedure
    .query(async ({ ctx }) => {
      // 1. Obtener todos los adeudos pendientes o vencidos
      const adeudos = await ctx.prisma.calendarioPago.findMany({
        where: { 
          estadoCobro: { in: ['PENDIENTE', 'VENCIDO'] },
          eliminadoEn: null 
        },
        include: {
          alumno: {
            include: {
              nivel: true,
              tutoresAlumnos: {
                where: { esPrincipal: true },
                include: { tutor: true }
              }
            }
          }
        }
      });

      // 2. Agrupar por alumno para no omitir a hermanos en distintos niveles
      const pendientesMap = new Map<number, { tutorId: number, nombreTutor: string, alumnoId: number, nombreAlumno: string, deudaMonto: number, nivelNombre: string }>();

      for (const a of adeudos) {
        const relacionPrincipal = a.alumno.tutoresAlumnos[0];
        const tutorId = relacionPrincipal?.tutor?.tutorId || -a.alumno.alumnoId;
        const nombreTutor = relacionPrincipal?.tutor?.nombreCompleto || 'Sin Tutor Asignado';
        const alumnoId = a.alumno.alumnoId;
        
        const current = pendientesMap.get(alumnoId) || {
          tutorId: tutorId,
          nombreTutor: nombreTutor,
          alumnoId: alumnoId,
          nombreAlumno: a.alumno.nombreCompleto,
          deudaMonto: 0,
          nivelNombre: a.alumno.nivel.nombre
        };

        current.deudaMonto += Number(a.saldoPendiente);
        pendientesMap.set(alumnoId, current);
      }

      // 3. Ordenar descendentemente por deuda (sin límite)
      const cuentasPendientes = Array.from(pendientesMap.values())
        .filter(c => c.deudaMonto > 0)
        .sort((a, b) => b.deudaMonto - a.deudaMonto);

      return cuentasPendientes;
    }),
});
