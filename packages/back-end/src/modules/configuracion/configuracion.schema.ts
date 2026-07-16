import { z } from 'zod';

export const updateConfigSchema = z.object({
  fechaVencimientoDefecto: z.string().datetime().nullable().optional(),
  plazoInscripcionDias: z.number().int().min(1, 'El plazo de inscripción debe ser al menos 1 día').optional(),
  umbralesSmtpDias: z.array(z.number().int().min(0)).max(5, 'Máximo 5 umbrales permitidos').optional(),
  montoRecargoDefecto: z.number().min(0).optional(),
  diasGraciaRecargo: z.number().int().min(0).optional(),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;

export const createConfiguracionRecargoSchema = z.object({
  conceptoPago: z.string().min(1, 'El concepto es requerido'),
  monto: z.number().min(0, 'El monto no puede ser negativo'),
  diasGracia: z.number().int().min(0, 'Los días de gracia no pueden ser negativos'),
});

export const updateConfiguracionRecargoSchema = z.object({
  id: z.number(),
  monto: z.number().min(0, 'El monto no puede ser negativo').optional(),
  diasGracia: z.number().int().min(0, 'Los días de gracia no pueden ser negativos').optional(),
  activo: z.boolean().optional(),
});

export type CreateConfiguracionRecargoInput = z.infer<typeof createConfiguracionRecargoSchema>;
export type UpdateConfiguracionRecargoInput = z.infer<typeof updateConfiguracionRecargoSchema>;
