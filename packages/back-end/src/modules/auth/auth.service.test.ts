import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  }
}));

describe('AuthService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('debería rechazar si el usuario no existe', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.intentoLogin.create.mockResolvedValue({} as any);

      await expect(AuthService.login({ identificador: 'admin@colegio.edu', contrasena: 'badpass' }, '127.0.0.1', 'jest-test'))
        .rejects.toThrowError(new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' }));
    });

    it('debería retornar token si el password es correcto', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        usuarioId: 1,
        nombreUsuario: 'testuser',
        nombreCompleto: 'Test User',
        correo: 'test@sga.com',
        activo: true,
        eliminadoEn: null,
        bloqueadoHasta: null,
        intentosFallidos: 0,
        passwordHash: 'hash',
        roles: [{ rol: { nombre: 'ADMIN' } }],
        debeCambiarPwd: false
      } as any);

      (bcrypt.compare as any).mockResolvedValue(true);
      prismaMock.usuario.update.mockResolvedValue({} as any);
      prismaMock.intentoLogin.create.mockResolvedValue({} as any);

      const result = await AuthService.login({ identificador: 'admin@colegio.edu', contrasena: '123456' }, '127.0.0.1', 'jest-test');

      expect(result).toHaveProperty('token');
      expect(result.usuario).toEqual({
        id: 1,
        nombre: 'Test User',
        roles: ['ADMIN'],
        debeCambiarPwd: false
      });
    });
    it('debería rechazar si la cuenta está inactiva o eliminada', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        usuarioId: 1,
        activo: false,
        eliminadoEn: null,
      } as any);

      await expect(AuthService.login({ identificador: 'test@sga.com', contrasena: '123' }, '127.0.0.1', 'test'))
        .rejects.toThrowError(new TRPCError({ code: 'UNAUTHORIZED', message: 'Cuenta desactivada o eliminada' }));
    });

    it('debería rechazar si la cuenta está bloqueada temporalmente', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      prismaMock.usuario.findFirst.mockResolvedValue({
        usuarioId: 1,
        activo: true,
        eliminadoEn: null,
        bloqueadoHasta: futureDate,
      } as any);

      await expect(AuthService.login({ identificador: 'test@sga.com', contrasena: '123' }, '127.0.0.1', 'test'))
        .rejects.toThrowError(new TRPCError({ code: 'UNAUTHORIZED', message: 'Cuenta bloqueada temporalmente' }));
    });

    it('debería incrementar intentos fallidos si el password es incorrecto', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        usuarioId: 1,
        activo: true,
        eliminadoEn: null,
        bloqueadoHasta: null,
        intentosFallidos: 2,
        passwordHash: 'hash',
      } as any);

      (bcrypt.compare as any).mockResolvedValue(false);
      
      await expect(AuthService.login({ identificador: 'test@sga.com', contrasena: 'wrong' }, '127.0.0.1', 'test'))
        .rejects.toThrowError(new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' }));

      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        data: { intentosFallidos: 3, bloqueadoHasta: null }
      });
    });

    it('debería bloquear la cuenta al llegar a 5 intentos fallidos', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        usuarioId: 1,
        activo: true,
        eliminadoEn: null,
        bloqueadoHasta: null,
        intentosFallidos: 4,
        passwordHash: 'hash',
      } as any);

      (bcrypt.compare as any).mockResolvedValue(false);
      
      await expect(AuthService.login({ identificador: 'test@sga.com', contrasena: 'wrong' }, '127.0.0.1', 'test'))
        .rejects.toThrowError(new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' }));

      // Verificar que update haya sido llamado con intentosFallidos: 5 y un bloqueadoHasta válido
      const updateCall = prismaMock.usuario.update.mock.calls[0][0] as any;
      expect(updateCall.where.usuarioId).toBe(1);
      expect(updateCall.data.intentosFallidos).toBe(5);
      expect(updateCall.data.bloqueadoHasta).toBeInstanceOf(Date);
    });
  });

  describe('logout', () => {
    it('debería crear un TokenRevocado exitosamente', async () => {
      prismaMock.tokenRevocado.create.mockResolvedValue({} as any);

      const result = await AuthService.logout('jti-123', 1, 1690000000);

      expect(result).toEqual({ success: true });
      expect(prismaMock.tokenRevocado.create).toHaveBeenCalledWith({
        data: {
          jti: 'jti-123',
          usuarioId: 1,
          expiraEn: new Date(1690000000 * 1000)
        }
      });
    });

    it('debería lanzar error 500 si la base de datos falla al revocar', async () => {
      prismaMock.tokenRevocado.create.mockRejectedValue(new Error('DB error'));

      await expect(AuthService.logout('jti-123', 1, 1690000000))
        .rejects.toThrowError(new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al cerrar sesión' }));
    });
  });
});
