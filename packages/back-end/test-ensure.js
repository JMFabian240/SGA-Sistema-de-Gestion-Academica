const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { GruposService } = require('./dist/modules/grupos/grupos.service');

async function main() {
  await prisma.grado.deleteMany({ where: { gradoId: { gte: 115 } } });
  
  // Call ensure twice
  await GruposService.ensureNivelesYGrados();
  await GruposService.ensureNivelesYGrados();
  
  const g = await prisma.grado.findMany();
  console.log(g.length);
}

main().finally(() => prisma.$disconnect());
