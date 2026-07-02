import { z } from 'zod';

const CriterioBecaEnum = z.enum([
  'ACADEMICA', 'SOCIOECONOMICA', 'DEPORTIVA', 
  'CULTURAL', 'POR_HERMANOS', 'PROMOCION_TEMPRANA', 'EXTERNA'
]);

const EstadoBecaEnum = z.enum([
  'ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'VENCIDA'
]);

// Catálogo de Becas
export const createBecaSchema = z.object({
  nombreBeca: z.string().min(1, 'El nombre es requerido').max(60),
  criterio: CriterioBecaEnum,
  porcentaje: z.number().positive().max(100, 'El porcentaje máximo es 100'),
  descripcion: z.string().optional()
});

export const updateBecaSchema = createBecaSchema.partial().extend({
  becaId: z.number().int().positive()
});

// Solicitud de Beca
export const createSolicitudBecaSchema = z.object({
  alumnoId: z.number().int().positive(),
  becaId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
  estado: EstadoBecaEnum.default('ACTIVA') // Utilizando el enum definido en Prisma
});

export const resolverSolicitudBecaSchema = z.object({
  solicitudId: z.number().int().positive(),
  aprobar: z.boolean(),
  observacionesResolucion: z.string().optional()
});

// Asignación Directa de Beca
export const assignBecaSchema = z.object({
  alumnoId: z.number().int().positive(),
  becaId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
  solicitudId: z.number().int().positive().optional(),
  estado: EstadoBecaEnum.default('ACTIVA'),
  fechaAsignacion: z.string().datetime()
});

// Types
export type CreateBecaInput = z.infer<typeof createBecaSchema>;
export type UpdateBecaInput = z.infer<typeof updateBecaSchema>;
export type CreateSolicitudBecaInput = z.infer<typeof createSolicitudBecaSchema>;
export type ResolverSolicitudBecaInput = z.infer<typeof resolverSolicitudBecaSchema>;
export type AssignBecaInput = z.infer<typeof assignBecaSchema>;
