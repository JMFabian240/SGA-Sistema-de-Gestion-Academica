import { prisma } from './src';

async function main() {
  const niveles = await prisma.nivelEducativo.findMany({
    include: {
      grados: true,
      grupos: true
    }
  });

  console.log("NIVELES USADOS:");
  niveles.forEach(n => {
    console.log(`- ${n.nombre} (ID: ${n.nivelId}): ${n.grados.length} grados, ${n.grupos.length} grupos`);
  });
}

main().finally(() => prisma.$disconnect());
