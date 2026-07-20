import cron from 'node-cron';
import { prisma, EstadoCobro } from '@sga/data-access';

export function initCronRecargos() {
  // Correr todos los días a las 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('[CRON] Iniciando cálculo automático de recargos...');
    try {
      const config = await prisma.configuracionGlobal.findFirst({ where: { configuracionId: 1 } });
      const montoRecargo = Number(config?.montoRecargoDefecto || 0);
      const diasGracia = config?.diasGraciaRecargo || 0;

      if (montoRecargo <= 0) {
        console.log('[CRON] No hay monto de recargo configurado. Abortando.');
        return;
      }

      const hoy = new Date();
      // Buscamos los vencidos que exceden los días de gracia, que aún están pendientes o vencidos
      // Solo aplicamos el recargo automático a los que no tienen recargo (montoRecargo = 0)
      
      const adeudosVencidos = await prisma.calendarioPago.findMany({
        where: {
          estadoCobro: { in: [EstadoCobro.VENCIDO, EstadoCobro.PENDIENTE] },
          montoRecargo: 0, 
          eliminadoEn: null
        }
      });

      let aplicados = 0;
      for (const adeudo of adeudosVencidos) {
        const fechaLimite = new Date(adeudo.fechaVencimiento);
        fechaLimite.setDate(fechaLimite.getDate() + diasGracia);

        if (hoy > fechaLimite) {
          // Aplicar recargo
          const nuevoMontoRecargo = Number(adeudo.montoRecargo) + montoRecargo;
          const nuevoSaldoPendiente = Number(adeudo.saldoPendiente) + montoRecargo;
          
          await prisma.calendarioPago.update({
            where: { calendarioPagoId: adeudo.calendarioPagoId },
            data: {
              montoRecargo: nuevoMontoRecargo,
              saldoPendiente: nuevoSaldoPendiente,
              estadoCobro: EstadoCobro.VENCIDO
            }
          });
          aplicados++;
        }
      }

      console.log(`[CRON] Recargos automáticos aplicados a ${aplicados} adeudos.`);
    } catch (err) {
      console.error('[CRON] Error calculando recargos:', err);
    }
  }, {
    timezone: "America/Mexico_City"
  });
}
