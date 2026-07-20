import { z } from 'zod';

// Tarifas
export const createTarifaSchema = z.object({
  cicloId: z.number().int().positive(),
  nivelId: z.number().int().positive(),
  concepto: z.string().min(1).max(100),
  monto: z.number().nonnegative('El monto no puede ser negativo'),
  fechaVencimiento: z.string().datetime().nullable().optional(),
  descripcion: z.string().optional(),
  activa: z.boolean().optional()
});

export const updateTarifaSchema = createTarifaSchema.partial().extend({
  tarifaId: z.number().int().positive()
});

// Calendario de Pagos (Generación de adeudos)
export const createCalendarioPagoSchema = z.object({
  alumnoId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
  concepto: z.string().min(1).max(100),
  mes: z.string().max(15).optional(),
  fechaVencimiento: z.string().datetime(),
  montoOriginal: z.number().positive(),
  montoPagado: z.number().nonnegative().optional(),
  montoRecargo: z.number().nonnegative().optional(),
  saldoPendiente: z.number().nonnegative()
});

export const updateCalendarioPagoSchema = createCalendarioPagoSchema.partial().extend({
  calendarioPagoId: z.number().int().positive()
});

// Pagos
const MetodoPagoEnum = z.enum(['DEPOSITO', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO']);

export const aplicacionPagoInputSchema = z.object({
  calendarioPagoId: z.number().int().positive(),
  montoAplicado: z.number().positive(),
  aplicadoA: z.enum(['CAPITAL', 'RECARGO']) // Según lógica de negocio ("CAPITAL" o "RECARGO")
});

export const registrarPagoSchema = z.object({
  alumnoId: z.number().int().positive(),
  tutorId: z.number().int().positive(),
  fechaPago: z.string().datetime(),
  montoTotal: z.number().positive(),
  metodoPago: MetodoPagoEnum,
  aplicadoASaldo: z.boolean().optional(),
  observaciones: z.string().optional(),
  requiereFactura: z.boolean().optional().default(false),
  comprobanteBase64: z.string().optional(),
  comprobanteNombre: z.string().optional(),
  comprobanteMime: z.string().optional(),
  // Detalle de a qué adeudos se abona este pago
  aplicaciones: z.array(aplicacionPagoInputSchema).min(1, "Debe existir al menos una aplicación del pago")
});

export const aplicarRecargoSchema = z.object({
  calendarioPagoId: z.number().int().positive(),
  montoRecargoPersonalizado: z.number().nonnegative().optional()
});

export const createCargoExtraordinarioSchema = z.object({
  alumnoId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
  concepto: z.string().min(3).max(100),
  monto: z.number().positive(),
  fechaVencimiento: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Debe ser una fecha válida (ISO 8601)",
  })
});

export const adjuntarComprobanteSchema = z.object({
  pagoId: z.number().int().positive(),
  alumnoId: z.number().int().positive(),
  comprobanteBase64: z.string(),
  comprobanteNombre: z.string(),
  comprobanteMime: z.string()
});

export type CreateTarifaInput = z.infer<typeof createTarifaSchema>;
export type UpdateTarifaInput = z.infer<typeof updateTarifaSchema>;
export type CreateCalendarioPagoInput = z.infer<typeof createCalendarioPagoSchema>;
export type UpdateCalendarioPagoInput = z.infer<typeof updateCalendarioPagoSchema>;
export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
export type CreateCargoExtraordinarioInput = z.infer<typeof createCargoExtraordinarioSchema>;
export type AplicacionPagoInput = z.infer<typeof aplicacionPagoInputSchema>;
export type AdjuntarComprobanteInput = z.infer<typeof adjuntarComprobanteSchema>;
