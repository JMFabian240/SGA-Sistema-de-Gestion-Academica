const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const g = await prisma.grado.findMany({ include: { nivel: true }, orderBy: { gradoId: 'asc' } });
  console.table(g.map(x => ({id: x.gradoId, num: x.numero, nom: x.nombre, niv: x.nivel.codigo})));
}
main().finally(() => prisma.$disconnect());
