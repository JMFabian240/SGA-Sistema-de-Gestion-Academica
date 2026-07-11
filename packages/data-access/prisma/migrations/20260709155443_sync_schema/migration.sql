/*
  Warnings:

  - You are about to drop the column `correo` on the `usuario` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "usuario_correo_key";

-- AlterTable
ALTER TABLE "calendario_pago" ALTER COLUMN "concepto" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "ciclo_escolar" ADD COLUMN     "periodicidad" VARCHAR(15) NOT NULL DEFAULT 'ANUAL';

-- AlterTable
ALTER TABLE "materia" ADD COLUMN     "docente_id" INTEGER,
ADD COLUMN     "tipo" VARCHAR(20) NOT NULL DEFAULT 'curricular';

-- AlterTable
ALTER TABLE "tarifa" ALTER COLUMN "concepto" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "correo";

-- AddForeignKey
ALTER TABLE "materia" ADD CONSTRAINT "materia_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;
