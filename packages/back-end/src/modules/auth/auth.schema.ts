import { z } from 'zod';

export const loginSchema = z.object({
  identificador: z.string().min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' }),
  contrasena: z.string().min(1, { message: 'La contraseña es requerida' })
});

export const tokenSchema = z.object({
  token: z.string().min(1, { message: 'El token es requerido' })
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TokenInput = z.infer<typeof tokenSchema>;
