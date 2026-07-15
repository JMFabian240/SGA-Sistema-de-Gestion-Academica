const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const g = await prisma.grado.findMany({ where: { gradoId: { gte: 115 } }, select: { gradoId: true, creadoEn: true } });
  console.log(g);
}
main().finally(() => prisma.$disconnect());
