import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth Module (Functional)', () => {
  let userMock: any;
  let rawPassword = 'ContrasenaSegura123!';

  beforeEach(async () => {
    // 1. Crear catálogo de roles requeridos
    const adminRol = await prisma.rol.create({
      data: {
        rolId: 1,
        codigo: 'ADMIN',
        nombre: 'ADMIN',
        descripcion: 'Administrador'
      }
    });

    // 2. Hashear contraseña de prueba
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 3. Crear usuario de prueba
    userMock = await prisma.usuario.create({
      data: {
        nombreUsuario: 'user_auth',
        nombreCompleto: 'Usuario Autenticable',
        correo: 'auth@sga.com',
        passwordHash,
        activo: true
      }
    });

    await prisma.usuarioRol.create({
      data: {
        usuarioId: userMock.usuarioId,
        rolId: adminRol.rolId,
        asignadoPor: userMock.usuarioId
      }
    });
  });

  describe('RF-1: Login Exitoso', () => {
    it('debería iniciar sesión usando el nombre de usuario o correo indistintamente', async () => {
      const ctx = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token: null
      };
      const caller = appRouter.createCaller(ctx);

      // 1. Login con correo
      const loginEmail = await caller.auth.login({
        identificador: 'auth@sga.com',
        contrasena: rawPassword
      });
      expect(loginEmail.token).toBeDefined();
      expect(loginEmail.usuario.nombre).toBe('Usuario Autenticable');
      expect(loginEmail.usuario.roles).toContain('ADMIN');

      // Verificar registro en intentoLogin
      const intentoEmail = await prisma.intentoLogin.findFirst({
        where: { nombreUsuarioIntentado: 'auth@sga.com' }
      });
      expect(intentoEmail).not.toBeNull();
      expect(intentoEmail?.exitoso).toBe(true);

      // 2. Login con nombreUsuario
      const loginUser = await caller.auth.login({
        identificador: 'user_auth',
        contrasena: rawPassword
      });
      expect(loginUser.token).toBeDefined();

      const intentoUser = await prisma.intentoLogin.findFirst({
        where: { nombreUsuarioIntentado: 'user_auth' }
      });
      expect(intentoUser?.exitoso).toBe(true);
    });
  });

  describe('RF-2: Login Fallido e Inactividad', () => {
    it('debería rechazar si el usuario no existe', async () => {
      const ctx = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token: null
      };
      const caller = appRouter.createCaller(ctx);

      await expect(caller.auth.login({
        identificador: 'inexistente@sga.com',
        contrasena: 'Alguna123!'
      })).rejects.toThrowError(/Credenciales inválidas/);

      // Verificar registro en intentoLogin
      const intento = await prisma.intentoLogin.findFirst({
        where: { nombreUsuarioIntentado: 'inexistente@sga.com' }
      });
      expect(intento).not.toBeNull();
      expect(intento?.exitoso).toBe(false);
      expect(intento?.usuarioId).toBeNull();
    });

    it('debería rechazar si el usuario está inactivo', async () => {
      // Poner usuario como inactivo
      await prisma.usuario.update({
        where: { usuarioId: userMock.usuarioId },
        data: { activo: false }
      });

      const ctx = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token: null
      };
      const caller = appRouter.createCaller(ctx);

      await expect(caller.auth.login({
        identificador: 'auth@sga.com',
        contrasena: rawPassword
      })).rejects.toThrowError(/Cuenta desactivada o eliminada/);

      // Verificar registro de intento
      const intento = await prisma.intentoLogin.findFirst({
        where: { nombreUsuarioIntentado: 'auth@sga.com' }
      });
      expect(intento?.exitoso).toBe(false);
      expect(intento?.usuarioId).toBe(userMock.usuarioId);
    });
  });

  describe('RF-3: Bloqueo de Cuentas (5 Intentos Fallidos)', () => {
    it('debería bloquear temporalmente la cuenta por 15 minutos en el 5º intento fallido', async () => {
      const ctx = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token: null
      };
      const caller = appRouter.createCaller(ctx);

      // Ejecutar 4 intentos fallidos
      for (let i = 1; i <= 4; i++) {
        await expect(caller.auth.login({
          identificador: 'auth@sga.com',
          contrasena: 'ContrasenaIncorrecta!'
        })).rejects.toThrowError(/Credenciales inválidas/);

        const dbUser = await prisma.usuario.findUnique({ where: { usuarioId: userMock.usuarioId } });
        expect(dbUser?.intentosFallidos).toBe(i);
        expect(dbUser?.bloqueadoHasta).toBeNull();
      }

      // 5º intento fallido
      await expect(caller.auth.login({
        identificador: 'auth@sga.com',
        contrasena: 'ContrasenaIncorrecta!'
      })).rejects.toThrowError(/Credenciales inválidas/);

      const dbUserBloqueado = await prisma.usuario.findUnique({ where: { usuarioId: userMock.usuarioId } });
      expect(dbUserBloqueado?.intentosFallidos).toBe(5);
      expect(dbUserBloqueado?.bloqueadoHasta).not.toBeNull();
      expect(dbUserBloqueado?.bloqueadoHasta!.getTime()).toBeGreaterThan(Date.now());

      // Intentar login con contraseña CORRECTA mientras está bloqueado
      await expect(caller.auth.login({
        identificador: 'auth@sga.com',
        contrasena: rawPassword
      })).rejects.toThrowError(/Cuenta bloqueada temporalmente/);
    });
  });

  describe('RF-4: Cierre de Sesión (Logout) y Token Revocado', () => {
    it('debería revocar el token y bloquear accesos subsiguientes', async () => {
      // 1. Obtener un token real logeándonos
      const ctxLogin = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token: null
      };
      const callerLogin = appRouter.createCaller(ctxLogin);
      const { token } = await callerLogin.auth.login({
        identificador: 'auth@sga.com',
        contrasena: rawPassword
      });

      // 2. Acceder a un endpoint protegido
      const ctxProtected = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token
      };
      const callerProtected = appRouter.createCaller(ctxProtected);
      const meResult = await callerProtected.auth.me();
      expect(meResult.usuarioId).toBe(userMock.usuarioId);

      // 3. Ejecutar Logout
      const logoutResult = await callerProtected.auth.logout();
      expect(logoutResult.success).toBe(true);

      // 4. Intentar acceder de nuevo con el mismo token (debería lanzar UNAUTHORIZED)
      await expect(callerProtected.auth.me())
        .rejects.toThrowError(/El token ha sido revocado/);
    });
  });

  describe('RF-5: Endpoint Me', () => {
    it('debería retornar el perfil si el token es válido o lanzar error si no se suministra', async () => {
      // Sin token
      const ctxNoToken = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token: null
      };
      const callerNoToken = appRouter.createCaller(ctxNoToken);
      await expect(callerNoToken.auth.me())
        .rejects.toThrowError(/No se proporcionó un token de acceso/);

      // Con token inválido
      const ctxBadToken = {
        req: { headers: {}, ip: '127.0.0.1' } as any,
        res: {} as any,
        prisma,
        token: 'invalid-token-string'
      };
      const callerBadToken = appRouter.createCaller(ctxBadToken);
      await expect(callerBadToken.auth.me())
        .rejects.toThrowError(/Token inválido o expirado/);
    });
  });
});
