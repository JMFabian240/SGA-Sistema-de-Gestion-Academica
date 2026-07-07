import { z } from 'zod';

// Tarifas
export const createTarifaSchema = z.object({
  cicloId: z.number().int().positive(),
  nivelId: z.number().int().positive(),
  concepto: z.string().min(1).max(15),
  monto: z.number().nonnegative('El monto no puede ser negativo'),
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
  concepto: z.string().min(1).max(25),
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
  // Detalle de a qué adeudos se abona este pago
  aplicaciones: z.array(aplicacionPagoInputSchema).min(1, "Debe existir al menos una aplicación del pago")
});

export type CreateTarifaInput = z.infer<typeof createTarifaSchema>;
export type UpdateTarifaInput = z.infer<typeof updateTarifaSchema>;
export type CreateCalendarioPagoInput = z.infer<typeof createCalendarioPagoSchema>;
export type UpdateCalendarioPagoInput = z.infer<typeof updateCalendarioPagoSchema>;
export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
export type AplicacionPagoInput = z.infer<typeof aplicacionPagoInputSchema>;
