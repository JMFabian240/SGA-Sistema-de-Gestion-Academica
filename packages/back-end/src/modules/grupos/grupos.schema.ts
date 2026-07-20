import { z } from 'zod';

// Nivel Educativo
export const createNivelEducativoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(15),
  nombre: z.string().min(1, 'El nombre es requerido').max(60),
  rvoe: z.string().max(40).optional(),
  orden: z.number().int()
});

export const updateNivelEducativoSchema = createNivelEducativoSchema.partial().extend({
  nivelId: z.number().int().positive()
});

// Grado
export const createGradoSchema = z.object({
  nivelId: z.number().int().positive(),
  numero: z.number().int().positive(),
  nombre: z.string().min(1, 'El nombre del grado es requerido').max(50)
});

export const updateGradoSchema = createGradoSchema.partial().extend({
  gradoId: z.number().int().positive()
});

// Ciclo Escolar
export const createCicloEscolarSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(20),
  fechaInicio: z.string().datetime({ message: 'Formato de fecha inválido' }),
  fechaFin: z.string().datetime({ message: 'Formato de fecha inválido' }),
  activo: z.boolean().optional(),
  abierto: z.boolean().optional(),
  periodicidad: z.enum(['ANUAL', 'SEMESTRAL']).optional(),
  gradosPermitidos: z.record(z.array(z.number().int().positive())).optional(),
  clonarGruposDesdeCicloId: z.number().int().positive().optional(),
  clonarTarifasDesdeCicloId: z.number().int().positive().optional()
});

export const updateCicloEscolarSchema = createCicloEscolarSchema.omit({ clonarGruposDesdeCicloId: true, clonarTarifasDesdeCicloId: true }).partial().extend({
  cicloId: z.number().int().positive()
});

export const transicionCicloSchema = z.object({
  cicloActualId: z.number().int().positive(),
  cicloDestinoId: z.number().int().positive(),
  alumnosPorGrupo: z.record(z.array(z.number().int().positive())) // { "grupoId": [alumnoId1, alumnoId2] }
});

export const inscribirAlumnosTransicionSchema = z.object({
  cicloDestinoId: z.number().int().positive(),
  alumnosPorGrupo: z.record(z.array(z.number().int().positive())) // { "grupoDestinoId": [alumnoId1, alumnoId2] }
});

export const cerrarCicloSchema = z.object({
  cicloId: z.number().int().positive()
});

// Materia
export const createMateriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(80),
  clave: z.string().max(20).optional(),
  gradoId: z.number().int().positive().optional().nullable(),
  grupoId: z.number().int().positive().optional().nullable(),
  tipo: z.enum(['curricular', 'extracurricular', 'taller']).optional(),
  docenteId: z.number().int().positive().optional().nullable()
});

export const updateMateriaSchema = createMateriaSchema.partial().extend({
  materiaId: z.number().int().positive()
});

// Grupo
export const createGrupoSchema = z.object({
  nivelId: z.number().int().positive(),
  cicloId: z.number().int().positive(),
  gradoId: z.number().int().positive(),
  nombre: z.string().min(1, 'El nombre es requerido').max(10),
  cupoMaximo: z.number().int().positive()
});

export const updateGrupoSchema = createGrupoSchema.partial().extend({
  grupoId: z.number().int().positive()
});

// GrupoMateria (Asignación)
export const assignMateriaGrupoSchema = z.object({
  grupoId: z.number().int().positive(),
  materiaId: z.number().int().positive(),
  docenteId: z.number().int().positive().optional()
});

export const unassignMateriaGrupoSchema = z.object({
  grupoMateriaId: z.number().int().positive()
});

// Cierre de Grupo
export const getAlumnosCierreGrupoSchema = z.object({
  grupoId: z.number().int().positive()
});

export const cerrarCicloGrupoSchema = z.object({
  grupoId: z.number().int().positive(),
  promociones: z.array(z.object({
    alumnoId: z.number().int().positive(),
    promover: z.boolean(),
    motivoRetencionOverride: z.enum(['RETENCION_FINANCIERA', 'RETENCION_ACADEMICA', 'BAJA_DEFINITIVA']).optional()
  }))
});

// Inicialización Selectiva de Grupos
export const getGradosParaInicializarSchema = z.object({
  cicloId: z.number().int().positive()
});

export const inicializarGruposSeleccionadosSchema = z.object({
  cicloId: z.number().int().positive(),
  grupos: z.array(z.object({
    gradoId: z.number().int().positive(),
    nombre: z.string().min(1, 'El nombre es requerido').max(10),
    cupoMaximo: z.number().int().positive().default(30)
  }))
});

// Types
export type CreateNivelEducativoInput = z.infer<typeof createNivelEducativoSchema>;
export type UpdateNivelEducativoInput = z.infer<typeof updateNivelEducativoSchema>;
export type CreateGradoInput = z.infer<typeof createGradoSchema>;
export type UpdateGradoInput = z.infer<typeof updateGradoSchema>;
export type CreateCicloEscolarInput = z.infer<typeof createCicloEscolarSchema>;
export type UpdateCicloEscolarInput = z.infer<typeof updateCicloEscolarSchema>;
export type TransicionCicloInput = z.infer<typeof transicionCicloSchema>;
export type CerrarCicloInput = z.infer<typeof cerrarCicloSchema>;
export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;
export type CreateGrupoInput = z.infer<typeof createGrupoSchema>;
export type UpdateGrupoInput = z.infer<typeof updateGrupoSchema>;
export type AssignMateriaGrupoInput = z.infer<typeof assignMateriaGrupoSchema>;
export type UnassignMateriaGrupoInput = z.infer<typeof unassignMateriaGrupoSchema>;
export type GetAlumnosCierreGrupoInput = z.infer<typeof getAlumnosCierreGrupoSchema>;
export type CerrarCicloGrupoInput = z.infer<typeof cerrarCicloGrupoSchema>;
export type GetGradosParaInicializarInput = z.infer<typeof getGradosParaInicializarSchema>;
export type InicializarGruposSeleccionadosInput = z.infer<typeof inicializarGruposSeleccionadosSchema>;
export type InscribirAlumnosTransicionInput = z.infer<typeof inscribirAlumnosTransicionSchema>;
