import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TRPCError } from '@trpc/server';
import { type LoginInput } from './auth.schema';
import { AuthRepository } from './auth.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export class AuthService {
  static async login(input: LoginInput, ip: string, userAgent: string) {
    const usuario = await AuthRepository.findUsuarioByIdentifier(input.identificador);

    if (!usuario) {
      await this.registrarIntentoLogin(null, input.identificador, false, ip, userAgent);
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
    }

    if (!usuario.activo || usuario.eliminadoEn) {
      await this.registrarIntentoLogin(usuario.usuarioId, input.identificador, false, ip, userAgent);
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Cuenta desactivada o eliminada' });
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      await this.registrarIntentoLogin(usuario.usuarioId, input.identificador, false, ip, userAgent);
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Cuenta bloqueada temporalmente' });
    }

    const isValid = await bcrypt.compare(input.contrasena, usuario.passwordHash);

    if (!isValid) {
      // Incrementar intentos fallidos
      const intentos = (usuario.intentosFallidos || 0) + 1;
      let bloqueadoHasta = null;

      if (intentos >= 5) {
        bloqueadoHasta = new Date();
        bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + 15); // Bloquear por 15 minutos
      }

      await AuthRepository.updateUsuarioIntentos(usuario.usuarioId, intentos, bloqueadoHasta);
      await this.registrarIntentoLogin(usuario.usuarioId, input.identificador, false, ip, userAgent);
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
    }

    // Resetear intentos fallidos y actualizar último acceso
    await AuthRepository.resetUsuarioIntentos(usuario.usuarioId);
    await this.registrarIntentoLogin(usuario.usuarioId, input.identificador, true, ip, userAgent);

    // Generar token JWT
    const jti = crypto.randomUUID();
    const token = jwt.sign(
      {
        usuarioId: usuario.usuarioId,
        nombreUsuario: usuario.nombreUsuario,
        jti,
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return {
      token,
      usuario: {
        id: usuario.usuarioId,
        nombre: usuario.nombreCompleto,
        roles: usuario.roles.map(r => r.rol.nombre),
        debeCambiarPwd: usuario.debeCambiarPwd
      }
    };
  }

  static async logout(jti: string, usuarioId: number, exp: number) {
    try {
      await AuthRepository.revocarToken(jti, usuarioId, new Date(exp * 1000));
      return { success: true };
    } catch (e) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al cerrar sesión' });
    }
  }

  private static async registrarIntentoLogin(
    usuarioId: number | null,
    nombreUsuarioIntentado: string,
    exitoso: boolean,
    ip: string,
    userAgent: string
  ) {
    try {
      await AuthRepository.registrarIntentoLogin(usuarioId, nombreUsuarioIntentado, exitoso, ip, userAgent);
    } catch (e) {
      console.error('Error al registrar intento de login', e);
    }
  }
}
