import { prisma } from './src';
async function main() {
  const niveles = await prisma.nivelEducativo.findMany({ orderBy: { orden: 'asc' } });
  console.log('NIVELES:');
  console.log(niveles.map(n => ({ id: n.nivelId, nombre: n.nombre, orden: n.orden })));
  const grados = await prisma.grado.findMany();
  console.log('GRADOS:');
  console.log(grados.map(g => ({ id: g.gradoId, nombre: g.nombre, nivelId: g.nivelId })));
}
main().finally(() => prisma.$disconnect());
