import { z } from 'zod';

// Datos Fiscales
export const upsertDatosFiscalesSchema = z.object({
  rfc: z.string().min(1, 'El RFC es requerido').max(13),
  razonSocial: z.string().min(1, 'La Razón Social es requerida').max(120),
  regimenFiscal: z.string().max(10).optional(),
  usoCfdi: z.string().max(10).optional(),
  direccionFiscal: z.string().optional(),
  codigoPostal: z.string().max(10).optional(),
  correoFacturacion: z.string().email('Correo de facturación inválido').max(255).optional(),
});

// Tutor
export const createTutorSchema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido').max(120),
  correoElectronico: z.string().email('Correo electrónico inválido').max(255).optional(),
  telefono: z.string().max(15).optional(),
  direccion: z.string().optional(),
  curp: z.string().max(18).optional(),
  requiereFactura: z.boolean().optional(),
  tipoPagoHabitual: z.string().max(15).optional(),
  
  // Opcionalmente se pueden incluir datos fiscales en la creación
  datosFiscales: upsertDatosFiscalesSchema.optional()
});

export const updateTutorSchema = createTutorSchema.partial().extend({
  tutorId: z.number().int().positive()
});

export type UpsertDatosFiscalesInput = z.infer<typeof upsertDatosFiscalesSchema>;
export type CreateTutorInput = z.infer<typeof createTutorSchema>;
export type UpdateTutorInput = z.infer<typeof updateTutorSchema>;
