import { PrismaClient } from '@prisma/client';
import { PagosService } from '../../../../back-end/src/modules/pagos/pagos.service';
import { parseExcel, parseSheetName } from './excelHelper';

export const seedCalendarioPagos = async (prisma: PrismaClient) => {
  console.log('--- 06 Simulando Pagos y Morosidad ---');

  const { alumnosList } = parseExcel();

  const alumnosDB = await prisma.alumno.findMany({ include: { tutoresAlumnos: true } });

  for (const row of alumnosList) {
    const alumno = alumnosDB.find(a => a.nombreCompleto === row.nombre.substring(0, 120));
    if (!alumno) continue;

    const tutorPrincipal = alumno.tutoresAlumnos.find(t => t.esPrincipal);
    if (!tutorPrincipal) continue;

    const adeudos = await prisma.calendarioPago.findMany({
      where: { alumnoId: alumno.alumnoId, eliminadoEn: null }
    });

    // Encontrar el adeudo de Septiembre
    const adeudoSeptiembre = adeudos.find(a => a.mes === 'Septiembre');
    if (!adeudoSeptiembre) continue;

    if (row.moroso) {
      // Simular que el mes pasó y no pagó (cambia estado a VENCIDO)
      await prisma.calendarioPago.update({
        where: { calendarioPagoId: adeudoSeptiembre.calendarioPagoId },
        data: { estadoCobro: 'VENCIDO' }
      });
    } else {
      // Simular pago correcto y a tiempo a través de la Capa de Negocio (Service)
      await PagosService.registrarPago({
        alumnoId: alumno.alumnoId,
        tutorId: tutorPrincipal.tutorId,
        fechaPago: new Date('2025-09-05T10:00:00Z').toISOString(),
        montoTotal: Number(adeudoSeptiembre.saldoPendiente),
        metodoPago: 'TRANSFERENCIA',
        aplicaciones: [{
          calendarioPagoId: adeudoSeptiembre.calendarioPagoId,
          montoAplicado: Number(adeudoSeptiembre.saldoPendiente),
          aplicadoA: 'CAPITAL'
        }],
        requiereFactura: false
      }, 1);
    }
  }
};
