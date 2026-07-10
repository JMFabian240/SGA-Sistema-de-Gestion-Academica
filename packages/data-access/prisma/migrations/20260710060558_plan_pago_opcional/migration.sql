-- DropForeignKey
ALTER TABLE "inscripcion_ciclo" DROP CONSTRAINT "inscripcion_ciclo_plan_pago_id_fkey";

-- AlterTable
ALTER TABLE "inscripcion_ciclo" ALTER COLUMN "plan_pago_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "inscripcion_ciclo" ADD CONSTRAINT "inscripcion_ciclo_plan_pago_id_fkey" FOREIGN KEY ("plan_pago_id") REFERENCES "plan_pago"("plan_pago_id") ON DELETE SET NULL ON UPDATE CASCADE;
