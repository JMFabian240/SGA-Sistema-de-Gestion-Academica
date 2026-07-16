const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const g = await prisma.grado.findMany({
    select: { gradoId: true, eliminadoEn: true, nivelId: true }
  });
  console.log(g);
}

main().finally(() => prisma.$disconnect());
