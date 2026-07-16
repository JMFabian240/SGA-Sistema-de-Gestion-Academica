const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // First, find what is referencing gradoId > 101
  const materias = await prisma.materia.findMany({ where: { gradoId: { gt: 101 } } });
  const grupos = await prisma.grupo.findMany({ where: { gradoId: { gt: 101 } } });
  const inscripciones = await prisma.inscripcionCiclo.findMany({ where: { OR: [ { grupo: { gradoId: { gt: 101 } } }, { alumno: { gradoId: { gt: 101 } } } ] } });
  
  console.log(`Materias: ${materias.length}`);
  console.log(`Grupos: ${grupos.length}`);
  console.log(`Inscripciones: ${inscripciones.length}`);

  if (materias.length > 0) {
    console.log(materias.map(m => ({materiaId: m.materiaId, gradoId: m.gradoId})));
  }
}

main().finally(() => prisma.$disconnect());
