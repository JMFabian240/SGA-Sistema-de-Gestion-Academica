import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { loginSchema } from './auth.schema';
import { AuthService } from './auth.service';
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req.ip || '0.0.0.0';
      const userAgent = ctx.req.headers['user-agent'] || 'unknown';
      return AuthService.login(input, ip, userAgent);
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.token) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      
      const decoded = jwt.decode(ctx.token) as { jti: string, usuarioId: number, exp: number };
      
      if (!decoded || !decoded.jti) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token inválido' });
      }

      return AuthService.logout(decoded.jti, decoded.usuarioId, decoded.exp);
    }),

  me: protectedProcedure
    .query(({ ctx }) => {
      return ctx.user;
    })
});
