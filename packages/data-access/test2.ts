import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  await p.inscripcionCiclo.updateMany({
    where: { 
      cicloId: 2,
      alumno: {
        nivel: {
          codigo: { not: 'BAC' }
        }
      }
    },
    data: {
      cicloId: 1
    }
  });
  console.log("Inscripciones actualizadas");
}
main();
