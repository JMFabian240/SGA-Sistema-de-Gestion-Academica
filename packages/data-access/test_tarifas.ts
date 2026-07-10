import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tarifas = await prisma.tarifa.findMany({ include: { nivel: true, ciclo: true } });
  console.log(JSON.stringify(tarifas, null, 2));
}

main().finally(() => prisma.$disconnect());
