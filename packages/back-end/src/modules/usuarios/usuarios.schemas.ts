import { z } from 'zod';

export const CrearUsuarioSchema = z.object({
  nombreUsuario: z.string().min(4).max(80),
  nombreCompleto: z.string().min(10).max(120),
  correo: z.string().email().max(255),
  password: z.string().min(8).max(50),
  telefono: z.string().max(15).optional(),
  roles: z.array(z.number()).min(1, 'Debe asignar al menos un rol'),
});

export const ActualizarEstadoUsuarioSchema = z.object({
  usuarioId: z.number(),
  activo: z.boolean(),
});

export const AsignarRolesSchema = z.object({
  usuarioId: z.number(),
  roles: z.array(z.number()),
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
