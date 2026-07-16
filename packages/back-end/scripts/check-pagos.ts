import { prisma } from '@sga/data-access';

async function main() {
  const totalApps = await prisma.aplicacionPago.count();
  console.log('Total de aplicaciones en BD:', totalApps);

  const alumnosConPagos = await prisma.alumno.findMany({
    where: {
      calendariosPagos: {
        some: { aplicacionesPago: { some: {} } }
      }
    },
    select: { alumnoId: true, nombreCompleto: true }
  });
  console.log('Alumnos con pagos:', alumnosConPagos.length);
  if (alumnosConPagos.length > 0) {
    console.log('Ejemplo:', alumnosConPagos[0]);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
