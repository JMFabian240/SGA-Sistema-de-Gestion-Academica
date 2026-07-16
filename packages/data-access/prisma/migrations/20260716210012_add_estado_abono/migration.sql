-- AlterEnum
ALTER TYPE "EstadoCobro" ADD VALUE 'ABONO';

-- AlterTable
ALTER TABLE "configuracion_global" ADD COLUMN     "fecha_vencimiento_defecto" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "configuracion_recargo" (
    "id" SERIAL NOT NULL,
    "concepto_pago" VARCHAR(100) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "dias_gracia" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_recargo_pkey" PRIMARY KEY ("id")
);
