import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';
import jwt from 'jsonwebtoken';

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware de autenticación
export const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No se proporcionó un token de acceso' });
  }
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
    // Se espera que el token tenga un identificador único jti
    const decoded = jwt.verify(ctx.token, JWT_SECRET) as { usuarioId: number, jti: string };
    
    // Verificar si el token (jti) fue revocado
    if (decoded.jti) {
      const isRevoked = await ctx.prisma.tokenRevocado.findUnique({
        where: { jti: decoded.jti }
      });
      
      if (isRevoked) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'El token ha sido revocado' });
      }
    }

    return next({
      ctx: {
        ...ctx,
        user: decoded,
      },
    });
  } catch (error) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token inválido o expirado' });
  }
});

// Middleware de Auditoría para mutaciones
export const auditMiddleware = t.middleware(async ({ type, path, ctx, next, rawInput }) => {
  const result = await next({ ctx });

  // Solo auditar mutaciones exitosas si hay usuario autenticado
  if (type === 'mutation' && result.ok && (ctx as any).user) {
    const usuarioId = (ctx as any).user.usuarioId;
    
    // Tratamos de inferir la acción en base a la convención de nombres
    let accion = 'UPDATE';
    if (path.includes('crear') || path.includes('agregar')) accion = 'INSERT';
    if (path.includes('eliminar') || path.includes('borrar')) accion = 'DELETE';

    // Disparamos la escritura sin bloquear el retorno al cliente
    ctx.prisma.logAuditoria.create({
      data: {
        usuarioId,
        accion,
        tablaAfectada: path, // Guardamos el nombre del procedure como tablaAfectada por simplicidad
        registroId: 'N/A', // Se requeriría introspección profunda para sacar el ID exacto del input/output
        valoresDespues: rawInput ? JSON.parse(JSON.stringify(rawInput)) : null,
        direccionIp: ctx.req?.ip || null,
        descripcion: `Ejecución exitosa de mutación TRPC: ${path}`,
      }
    }).catch(err => {
      console.error(`Error escribiendo en bitácora para ${path}:`, err);
    });
  }

  return result;
});

export const protectedProcedure = t.procedure.use(isAuthed).use(auditMiddleware);
