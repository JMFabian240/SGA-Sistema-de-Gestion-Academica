import { z } from 'zod';

const EstadoAlumno = z.enum([
  'ACTIVO',
  'BAJA_DEFINITIVA',
  'BAJA_TEMPORAL',
  'EGRESADO',
  'TRANSICION_PENDIENTE'
]);

export const createAlumnoSchema = z.object({
  matricula: z.string().max(30).optional(),
  curp: z.string().length(18, 'El CURP debe tener exactamente 18 caracteres').optional().nullable().or(z.literal('')),
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido').max(120),
  fechaNacimiento: z.string().datetime({ message: 'Formato de fecha de nacimiento inválido' }),
  sexo: z.string().length(1, 'El sexo debe ser M o F'),
  nivelId: z.number().int().positive('Nivel Educativo es requerido'),
  estado: EstadoAlumno,
  diaLimitePago: z.number().int().min(1).max(31).optional(),
  personasAutorizadas: z.any().optional(), // JSON de personas autorizadas
  tipoSangre: z.string().max(10).optional(),
  alergias: z.string().optional(),
  padecimientos: z.string().optional(),
  observaciones: z.string().optional(),
  gradoId: z.number().int().positive().optional(),
  grupoId: z.number().int().positive().optional(),
});

export const updateAlumnoSchema = createAlumnoSchema.partial().extend({
  alumnoId: z.number().int().positive(),
  fechaBaja: z.string().datetime().optional().nullable(),
  motivoBaja: z.string().optional().nullable()
});

export const linkTutorSchema = z.object({
  alumnoId: z.number().int().positive(),
  tutorId: z.number().int().positive(),
  esPrincipal: z.boolean().optional(),
  parentesco: z.string().min(1, 'El parentesco es requerido').max(20)
});

export const unlinkTutorSchema = z.object({
  tutorAlumnoId: z.number().int().positive()
});

export type CreateAlumnoInput = z.infer<typeof createAlumnoSchema>;
export type UpdateAlumnoInput = z.infer<typeof updateAlumnoSchema>;
export type LinkTutorInput = z.infer<typeof linkTutorSchema>;
export type UnlinkTutorInput = z.infer<typeof unlinkTutorSchema>;
