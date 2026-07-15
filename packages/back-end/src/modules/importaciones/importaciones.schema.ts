import { z } from 'zod';

export const CatalogoAcademicoSchema = z.object({
  'Nivel Educativo': z.string().min(1, 'El Nivel Educativo es obligatorio'),
  'Grado': z.string().min(1, 'El Grado es obligatorio'),
  'Nombre Grupo': z.string().min(1, 'El Nombre Grupo es obligatorio'),
  'Cupo Máximo': z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int().min(1, 'El Cupo Máximo debe ser mayor a 0')
  ),
});

export type CatalogoAcademicoImportRow = z.infer<typeof CatalogoAcademicoSchema>;

export const InscripcionAlumnoSchema = z.object({
  'Matrícula': z.string().optional(),
  'CURP Alumno': z.string().optional(),
  'Nombre Alumno': z.string().min(1, 'El Nombre Alumno es obligatorio'),
  'Fecha Nacimiento': z.string().min(1, 'La Fecha Nacimiento es obligatoria'),
  'Sexo': z.string().min(1, 'El Sexo es obligatorio').max(1),
  'Estado Alumno': z.enum(['ACTIVO', 'BAJA_DEFINITIVA', 'BAJA_TEMPORAL', 'EGRESADO', 'TRANSICION_PENDIENTE']).default('ACTIVO'),
  'Nombre Tutor': z.string().min(1, 'El Nombre Tutor es obligatorio'),
  'Parentesco': z.string().min(1, 'El Parentesco es obligatorio'),
  'Teléfono Tutor': z.string().optional(),
  'Correo Tutor': z.string().email('Correo inválido').or(z.literal('')).optional(),
  'Nivel Educativo Destino': z.string().min(1, 'El Nivel Educativo Destino es obligatorio'),
  'Grado Destino': z.string().min(1, 'El Grado Destino es obligatorio'),
  'Grupo Destino': z.string().min(1, 'El Grupo Destino es obligatorio'),
});

export type InscripcionAlumnoImportRow = z.infer<typeof InscripcionAlumnoSchema>;

export const PagosAnterioresSchema = z.object({
  'Matrícula': z.string().optional(),
  'CURP Alumno': z.string().optional(),
  'Nombre Alumno': z.string().min(1, 'El Nombre Alumno es obligatorio'),
  'Fecha Pago': z.string().min(1, 'La Fecha Pago es obligatoria'),
  'Monto Total': z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, 'El monto debe ser mayor a 0')
  ),
  'Método Pago': z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO']).default('EFECTIVO'),
  'Observaciones': z.string().optional(),
});

export type PagosAnterioresImportRow = z.infer<typeof PagosAnterioresSchema>;

export const SaldosInicialesSchema = z.object({
  'Matrícula': z.string().optional(),
  'CURP Alumno': z.string().optional(),
  'Nombre Alumno': z.string().min(1, 'El Nombre Alumno es obligatorio'),
  'Concepto': z.string().min(1, 'El Concepto es obligatorio'),
  'Mes': z.string().optional(),
  'Fecha Vencimiento': z.string().min(1, 'La Fecha de Vencimiento es obligatoria'),
  'Monto Original': z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, 'El monto debe ser mayor a 0')
  ),
  'Monto Pagado': z.preprocess(
    (val) => val ? parseFloat(String(val)) : 0,
    z.number().min(0).default(0)
  ),
  'Estado Cobro': z.enum(['PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO', 'CANCELADO']).default('PENDIENTE'),
});

export type SaldosInicialesImportRow = z.infer<typeof SaldosInicialesSchema>;
