import { prisma, EstadoCobro, MetodoPago } from '@sga/data-access';
import { PagosRepository } from '../src/modules/pagos/pagos.repository';

async function main() {
  console.log('Iniciando script para corregir pagos...');

  // 1. Obtener un registrador genérico
  const registrador = await prisma.usuario.findFirst({
    where: { activo: true },
    orderBy: { usuarioId: 'asc' }
  });
  if (!registrador) throw new Error('No se encontró un usuario para registrar los pagos.');

  // 2. Obtener todos los alumnos que tengan pagos pendientes o vencidos (no pagados)
  const alumnos = await prisma.alumno.findMany({
    where: {
      calendariosPagos: {
        some: {
          saldoPendiente: { gt: 0 }
        }
      }
    },
    include: {
      tutoresAlumnos: {
        where: { esPrincipal: true },
        include: { tutor: true }
      },
      calendariosPagos: {
        where: { saldoPendiente: { gt: 0 } },
        orderBy: { fechaVencimiento: 'asc' }
      }
    }
  });

  console.log(`Se encontraron ${alumnos.length} alumnos con pagos pendientes.`);

  let alumnosVencidos = 0;

  for (const alumno of alumnos) {
    const pagos = alumno.calendariosPagos;
    if (pagos.length === 0) continue;

    // Obtener tutor
    let tutorId = alumno.tutoresAlumnos[0]?.tutorId;
    if (!tutorId) {
      // Si no tiene tutor principal, intentar con cualquier tutor del alumno
      const cualquierTutor = await prisma.tutorAlumno.findFirst({ where: { alumnoId: alumno.alumnoId } });
      tutorId = cualquierTutor?.tutorId;
    }
    
    // Si de plano no tiene tutor, creamos o buscamos uno genérico para no fallar
    if (!tutorId) {
      const tutorGen = await prisma.tutor.findFirst();
      if (!tutorGen) {
         console.warn(`Alumno ${alumno.alumnoId} no tiene tutor y no hay tutores en BD. Saltando...`);
         continue;
      }
      tutorId = tutorGen.tutorId;
    }

    // Determinar si este alumno será uno de los 3 con pago vencido
    const dejarVencido = alumnosVencidos < 3;
    let pagoVencidoProcesado = false;

    for (const adeudo of pagos) {
      if (dejarVencido && !pagoVencidoProcesado) {
        // Dejar este pago como vencido
        await prisma.calendarioPago.update({
          where: { calendarioPagoId: adeudo.calendarioPagoId },
          data: {
            estadoCobro: EstadoCobro.VENCIDO,
            actualizadoEn: new Date()
          }
        });
        pagoVencidoProcesado = true;
        console.log(`Alumno ${alumno.alumnoId} - Pago ${adeudo.calendarioPagoId} marcado como VENCIDO.`);
      } else {
        // Pagar este pago utilizando PagosRepository para que se refleje en el módulo de pagos
        const montoTotal = Number(adeudo.saldoPendiente);
        
        await PagosRepository.registrarPagoTransaccion({
          pagoData: {
            alumnoId: alumno.alumnoId,
            tutorId,
            fechaPago: new Date(),
            montoTotal,
            metodoPago: MetodoPago.EFECTIVO,
            aplicadoASaldo: false,
            requiereFactura: false,
            observaciones: 'Pago automático - script de corrección',
            registradoPor: registrador.usuarioId
          },
          aplicaciones: [
            {
              calendarioPagoId: adeudo.calendarioPagoId,
              montoAplicado: montoTotal,
              aplicadoA: 'CAPITAL'
            }
          ],
          saldoAFavorGenerado: 0,
          tutorId,
          registradorId: registrador.usuarioId
        });
        console.log(`Alumno ${alumno.alumnoId} - Pago ${adeudo.calendarioPagoId} pagado ($${montoTotal}).`);
      }
    }

    if (dejarVencido) {
      alumnosVencidos++;
    }
  }

  console.log(`Script finalizado. Se dejaron ${alumnosVencidos} alumnos con un pago vencido.`);
}

main()
  .catch(e => {
    console.error('Error ejecutando script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
