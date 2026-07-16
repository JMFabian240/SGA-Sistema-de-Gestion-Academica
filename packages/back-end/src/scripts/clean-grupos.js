const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.grupo.deleteMany({
    where: {
      grupoId: {
        in: [305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317]
      }
    }
  });
  console.log(`Borrados ${deleted.count} grupos.`);
}

main().finally(() => prisma.$disconnect());
