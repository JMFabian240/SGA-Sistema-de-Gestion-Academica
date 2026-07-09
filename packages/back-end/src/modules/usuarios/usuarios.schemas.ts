import { z } from 'zod';
import { NivelPermiso } from '@prisma/client';

export const MODULOS_SISTEMA = [
  'Usuarios',
  'Alumnos',
  'Tutores',
  'Grupos',
  'Materias',
  'Pagos',
  'Becas',
  'Reportes',
  'Configuracion',
  'Calificaciones'
] as const;

export type ModuloSistema = typeof MODULOS_SISTEMA[number];

export const CrearUsuarioSchema = z.object({
  nombreUsuario: z.string().min(4).max(80),
  nombreCompleto: z.string().min(10).max(120),
  password: z.string().min(8).max(50),
  rolId: z.number().min(1, 'Debe seleccionar un rol'),
});

export const ActualizarEstadoUsuarioSchema = z.object({
  usuarioId: z.number(),
  activo: z.boolean(),
});

export const AsignarRolesSchema = z.object({
  usuarioId: z.number(),
  roles: z.array(z.number()),
});

export const ActualizarPasswordSchema = z.object({
  usuarioId: z.number(),
  nuevaPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(50),
});

export const PermisosModuloSchema = z.object({
  usuarioId: z.number(),
  permisos: z.array(z.object({
    modulo: z.enum(MODULOS_SISTEMA as any),
    nivel: z.nativeEnum(NivelPermiso)
  }))
});

export const ListarUsuariosSchema = z.object({
  pagina: z.number().min(1).default(1),
  limite: z.number().min(1).max(100).default(20),
  busqueda: z.string().optional(),
});

export type CrearUsuarioInput = z.infer<typeof CrearUsuarioSchema>;
export type ActualizarEstadoUsuarioInput = z.infer<typeof ActualizarEstadoUsuarioSchema>;
export type AsignarRolesInput = z.infer<typeof AsignarRolesSchema>;
export type ListarUsuariosInput = z.infer<typeof ListarUsuariosSchema>;
export type ActualizarPasswordInput = z.infer<typeof ActualizarPasswordSchema>;
export type PermisosModuloInput = z.infer<typeof PermisosModuloSchema>;
