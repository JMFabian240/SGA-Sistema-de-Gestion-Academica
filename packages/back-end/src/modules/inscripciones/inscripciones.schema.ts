import { z } from 'zod';

// --- Planes de Pago ---
export const createPlanPagoSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(40),
  meses: z.number().int().positive('Los meses deben ser mayor a 0'),
  montoMensual: z.number().positive(),
  montoDiciembre: z.number().nonnegative().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().default(true)
});

export const updatePlanPagoSchema = createPlanPagoSchema.partial().extend({
  planPagoId: z.number().int().positive()
});

// --- Ventanas de Inscripción Temprana ---
export const createVentanaInscripcionSchema = z.object({
  cicloId: z.number().int().positive(),
  becaId: z.number().int().positive(),
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime(),
  activa: z.boolean().default(true)
});

export const updateVentanaInscripcionSchema = createVentanaInscripcionSchema.partial().extend({
  ventanaId: z.number().int().positive()
});

// --- Inscripciones ---
export const createInscripcionSchema = z.object({
  alumnoId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
  grupoId: z.number().int().positive().optional().nullable(),
  fechaIngreso: z.string().datetime(),
  esIngresoTardio: z.boolean().default(false),
  estadoEnCiclo: z.string().min(1).max(20), // ej. 'INSCRITO', 'BAJA', etc.
  estadoFinanciero: z.string().min(1).max(20) // ej. 'AL_CORRIENTE', 'MOROSO'
});

export const updateInscripcionSchema = createInscripcionSchema.partial().extend({
  inscripcionId: z.number().int().positive()
});

export const inscribirExpressSchema = z.object({
  alumnoId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
  grupoId: z.number().int().positive(),
  becaId: z.number().int().positive().optional().nullable()
});

export const asignarPlanPagoSchema = z.object({
  inscripcionId: z.number().int().positive(),
  planPagoId: z.number().int().positive()
});

export const quitarPlanPagoSchema = z.object({
  inscripcionId: z.number().int().positive()
});

export const getTarifaColegiaturaSchema = z.object({
  inscripcionId: z.number().int().positive()
});

// Export Types
export type CreatePlanPagoInput = z.infer<typeof createPlanPagoSchema>;
export type UpdatePlanPagoInput = z.infer<typeof updatePlanPagoSchema>;
export type CreateVentanaInscripcionInput = z.infer<typeof createVentanaInscripcionSchema>;
export type UpdateVentanaInscripcionInput = z.infer<typeof updateVentanaInscripcionSchema>;


export type CreateInscripcionInput = z.infer<typeof createInscripcionSchema>;
export type UpdateInscripcionInput = z.infer<typeof updateInscripcionSchema>;
export type InscribirExpressInput = z.infer<typeof inscribirExpressSchema>;
export type AsignarPlanPagoInput = z.infer<typeof asignarPlanPagoSchema>;
export type QuitarPlanPagoInput = z.infer<typeof quitarPlanPagoSchema>;
export type GetTarifaColegiaturaInput = z.infer<typeof getTarifaColegiaturaSchema>;
