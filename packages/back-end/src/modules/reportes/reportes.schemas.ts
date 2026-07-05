import { z } from 'zod';

export const ReporteFechasSchema = z.object({
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime(),
});

export const ReporteAsistenciaSchema = z.object({
  grupoId: z.number(),
  mes: z.number().min(1).max(12).optional(),
  anio: z.number().min(2000).max(2100).optional(),
});

export type ReporteFechasInput = z.infer<typeof ReporteFechasSchema>;
export type ReporteAsistenciaInput = z.infer<typeof ReporteAsistenciaSchema>;
