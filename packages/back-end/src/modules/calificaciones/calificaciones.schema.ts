import { z } from 'zod';

const TipoEvaluacionEnum = z.enum([
  'PARCIAL', 'BIMESTRE', 'BLOQUE', 'TRIMESTRE'
]);

export const getCalificacionesGrupoSchema = z.object({
  grupoMateriaId: z.number().int().positive(),
  periodoId: z.number().int().positive().optional()
});

export const getCalificacionesAlumnoSchema = z.object({
  alumnoId: z.number().int().positive()
});

export const upsertCalificacionSchema = z.object({
  alumnoId: z.number().int().positive(),
  grupoMateriaId: z.number().int().positive(),
  periodoId: z.number().int().positive(),
  tipoEvaluacion: TipoEvaluacionEnum,
  valorNumerico: z.number().min(0).max(10).optional(),
  valorCualitativo: z.string().max(5).optional(),
  textoObservacion: z.string().optional(),
  textoRecomendacion: z.string().optional(),
  cuentaParaPromedio: z.boolean().default(true)
}).refine(data => data.valorNumerico !== undefined || data.valorCualitativo !== undefined, {
  message: "Debe proporcionar al menos un valor numérico o cualitativo",
  path: ["valorNumerico"]
});

export const deleteCalificacionSchema = z.object({
  calificacionId: z.number().int().positive()
});

export type GetCalificacionesGrupoInput = z.infer<typeof getCalificacionesGrupoSchema>;
export type GetCalificacionesAlumnoInput = z.infer<typeof getCalificacionesAlumnoSchema>;
export type UpsertCalificacionInput = z.infer<typeof upsertCalificacionSchema>;
export type DeleteCalificacionInput = z.infer<typeof deleteCalificacionSchema>;

export const GenerarBoletaSchema = z.object({
  alumnoId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
});

export const KardexSchema = z.object({
  alumnoId: z.number().int().positive(),
});

export type GenerarBoletaInput = z.infer<typeof GenerarBoletaSchema>;
export type KardexInput = z.infer<typeof KardexSchema>;
