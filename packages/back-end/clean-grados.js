const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const g = await prisma.grado.findMany({ include: { nivel: true } });
  console.log(g.length);
  console.log(g.map(x => ({id: x.gradoId, nombre: x.nombre, nivel: x.nivel.codigo})));
}
main().finally(() => prisma.$disconnect());
