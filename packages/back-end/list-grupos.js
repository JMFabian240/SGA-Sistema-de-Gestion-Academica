const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const g = await prisma.grupo.findMany({
    orderBy: { creadoEn: 'desc' },
    select: { grupoId: true, nombre: true, creadoEn: true }
  });
  console.log(g);
}

main().finally(() => prisma.$disconnect());
