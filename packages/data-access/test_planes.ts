import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Eliminando Plan General Automático...');
  
  await prisma.planPago.updateMany({
    where: {
      nombre: 'Plan General (Automático)'
    },
    data: {
      eliminadoEn: new Date(),
      activo: false
    }
  });

  console.log('Plan eliminado con éxito (soft delete).');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
