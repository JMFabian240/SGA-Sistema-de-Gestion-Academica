import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';
import jwt from 'jsonwebtoken';
import { NivelPermiso } from '@prisma/client';

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware de autenticación
export const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No se proporcionó un token de acceso' });
  }
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'sga_fallback_secret_for_production';
    const secret = JWT_SECRET;
    
    // Se espera que el token tenga un identificador único jti
    const decoded = jwt.verify(ctx.token, secret) as { usuarioId: number, jti: string };
    
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
    if (error instanceof TRPCError) {
      throw error;
    }
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

// Middleware para validación de roles (RBAC)
export const hasRoles = (allowedRoles: string[]) => t.middleware(async ({ ctx, next }) => {
  const user = (ctx as any).user;
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
  }

  // Buscar los roles del usuario en la base de datos
  const userRoles = await ctx.prisma.usuarioRol.findMany({
    where: { 
      usuarioId: user.usuarioId, 
      activo: true,
      eliminadoEn: null 
    },
    include: { rol: true }
  });

  const roles = userRoles.map(ur => ur.rol.codigo);
  const hasPermission = roles.some(role => allowedRoles.includes(role));

  if (!hasPermission) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta acción' });
  }

  return next({
    ctx: {
      ...ctx,
      roles,
    }
  });
});

// Middleware para validación de permisos por módulo (Módulos Granulares)
export const hasModulePermission = (modulo: string, requireWrite: boolean = false) => t.middleware(async ({ ctx, next }) => {
  const user = (ctx as any).user;
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
  }

  // Los administradores tienen acceso total a todos los módulos
  const userRoles = await ctx.prisma.usuarioRol.findMany({
    where: { usuarioId: user.usuarioId, activo: true, eliminadoEn: null },
    include: { rol: true }
  });
  const isAdmin = userRoles.some(ur => ur.rol.codigo === 'ADMIN');
  if (isAdmin) {
    return next({ ctx });
  }

  const permisoModulo = await ctx.prisma.usuarioPermisoModulo.findUnique({
    where: {
      usuarioId_modulo: {
        usuarioId: user.usuarioId,
        modulo: modulo
      }
    }
  });

  if (!permisoModulo || !permisoModulo.activo || permisoModulo.nivel === NivelPermiso.DENEGADO) {
    throw new TRPCError({ code: 'FORBIDDEN', message: `Acceso denegado al módulo: ${modulo}` });
  }

  if (requireWrite && permisoModulo.nivel !== NivelPermiso.LECTURA_Y_ESCRITURA) {
    throw new TRPCError({ code: 'FORBIDDEN', message: `No tiene permisos de escritura en el módulo: ${modulo}` });
  }

  return next({ ctx });
});

// Procedimientos con seguridad RBAC
export const adminProcedure = protectedProcedure.use(hasRoles(['ADMIN']));
export const gestorProcedure = protectedProcedure.use(hasRoles(['ADMIN', 'GESTOR']));
export const docentProcedure = protectedProcedure.use(hasRoles(['ADMIN', 'GESTOR', 'DOCENTE']));
