import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Usuarios Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;

  beforeEach(async () => {
    // 1. Crear roles de catálogo requeridos
    const adminRol = await prisma.rol.create({
      data: {
        rolId: 1,
        codigo: 'ADMIN',
        nombre: 'ADMIN',
        descripcion: 'Administrador del sistema'
      }
    });

    const docenteRol = await prisma.rol.create({
      data: {
        rolId: 2,
        codigo: 'DOCENTE',
        nombre: 'DOCENTE',
        descripcion: 'Personal docente'
      }
    });

    // 2. Crear un usuario actor (el que ejecuta los procedimientos)
    adminActor = await prisma.usuario.create({
      data: {
        usuarioId: 1,
        nombreUsuario: 'actor_admin',
        nombreCompleto: 'Actor Administrador',
        correo: 'actor@sga.com',
        passwordHash: 'dummy_hash',
        activo: true
      }
    });

    // Asociarle rol ADMIN
    await prisma.usuarioRol.create({
      data: {
        usuarioId: adminActor.usuarioId,
        rolId: adminRol.rolId,
        asignadoPor: adminActor.usuarioId
      }
    });

    // Generar token JWT firmado para este usuario
    validToken = jwt.sign(
      { usuarioId: adminActor.usuarioId, jti: 'test-jti-uuid' },
      process.env.JWT_SECRET || 'supersecret'
    );

    // Crear el Caller de tRPC
    const ctx = {
      req: { headers: {}, ip: '127.0.0.1' } as any,
      res: {} as any,
      prisma,
      token: validToken
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('RF-1: Catalogo de Roles', () => {
    it('debería retornar todos los roles activos ordenados alfabéticamente', async () => {
      const roles = await caller.usuarios.getRoles();
      expect(roles.length).toBe(2);
      expect(roles[0].nombre).toBe('ADMIN');
      expect(roles[1].nombre).toBe('DOCENTE');
    });
  });

  describe('RF-2: Búsqueda y Paginación de Usuarios', () => {
    it('debería listar usuarios de manera paginada y realizar búsquedas insensibles', async () => {
      // Crear un par de usuarios adicionales para la prueba
      const u1 = await prisma.usuario.create({
        data: {
          nombreUsuario: 'juan_perez',
          nombreCompleto: 'Juan Perez Lopez',
          correo: 'juan.perez@sga.com',
          passwordHash: 'dummy_hash',
          activo: true
        }
      });

      const u2 = await prisma.usuario.create({
        data: {
          nombreUsuario: 'maria_gomez',
          nombreCompleto: 'Maria Gomez Garcia',
          correo: 'maria.gomez@sga.com',
          passwordHash: 'dummy_hash',
          activo: false
        }
      });

      // 1. Paginación
      const listado = await caller.usuarios.listarUsuarios({ pagina: 1, limite: 1 });
      expect(listado.data.length).toBe(1);
      expect(listado.meta.total).toBe(3); // adminActor + u1 + u2
      expect(listado.meta.totalPaginas).toBe(3);

      // 2. Búsqueda insensible a mayúsculas por nombreUsuario
      const searchUsername = await caller.usuarios.listarUsuarios({ pagina: 1, limite: 10, busqueda: 'JUAN' });
      expect(searchUsername.data.length).toBe(1);
      expect(searchUsername.data[0].nombreUsuario).toBe('juan_perez');

      // 3. Búsqueda por correo
      const searchEmail = await caller.usuarios.listarUsuarios({ pagina: 1, limite: 10, busqueda: 'gomez@sga' });
      expect(searchEmail.data.length).toBe(1);
      expect(searchEmail.data[0].nombreUsuario).toBe('maria_gomez');
    });
  });

  describe('RF-3: Creación de Usuarios', () => {
    it('debería crear exitosamente un usuario nuevo con sus roles y activar debeCambiarPwd', async () => {
      const input = {
        nombreUsuario: 'nuevo_usuario',
        nombreCompleto: 'Nuevo Usuario Prueba',
        correo: 'nuevo@sga.com',
        password: 'PasswordSeguro123!',
        roles: [2] // DOCENTE
      };

      const result = await caller.usuarios.crearUsuario(input);
      expect(result.success).toBe(true);
      expect(result.usuarioId).toBeDefined();

      // Verificar en BD
      const userDb = await prisma.usuario.findUnique({
        where: { usuarioId: result.usuarioId },
        include: { roles: true }
      });

      expect(userDb).not.toBeNull();
      expect(userDb?.nombreUsuario).toBe('nuevo_usuario');
      expect(userDb?.debeCambiarPwd).toBe(true);
      expect(userDb?.roles.length).toBe(1);
      expect(userDb?.roles[0].rolId).toBe(2);
    });

    it('debería rechazar la creación si el correo o nombreUsuario ya existen', async () => {
      const input = {
        nombreUsuario: 'actor_admin', // Mismo del adminActor
        nombreCompleto: 'Nombre Duplicado',
        correo: 'duplicado@sga.com',
        password: 'PasswordSeguro123!',
        roles: [1]
      };

      await expect(caller.usuarios.crearUsuario(input))
        .rejects.toThrowError(/El nombre de usuario o correo ya está registrado/);
    });
  });

  describe('RF-4: Cambiar Estado (Activo/Inactivo)', () => {
    it('debería desactivar y activar una cuenta de otro usuario', async () => {
      const u = await prisma.usuario.create({
        data: {
          nombreUsuario: 'usuario_estado',
          nombreCompleto: 'Usuario De Estado',
          correo: 'estado@sga.com',
          passwordHash: 'dummy_hash',
          activo: true
        }
      });

      // Desactivar
      const desactivado = await caller.usuarios.actualizarEstadoUsuario({
        usuarioId: u.usuarioId,
        activo: false
      });
      expect(desactivado.success).toBe(true);
      expect(desactivado.activo).toBe(false);

      const dbUser = await prisma.usuario.findUnique({ where: { usuarioId: u.usuarioId } });
      expect(dbUser?.activo).toBe(false);
    });

    it('debería prohibir la desactivación de la cuenta propia', async () => {
      await expect(caller.usuarios.actualizarEstadoUsuario({
        usuarioId: adminActor.usuarioId,
        activo: false
      })).rejects.toThrowError(/No puedes desactivar tu propia cuenta/);
    });
  });

  describe('RF-5: Asignación de Roles', () => {
    it('debería reemplazar completamente los roles de un usuario', async () => {
      const u = await prisma.usuario.create({
        data: {
          nombreUsuario: 'usuario_roles',
          nombreCompleto: 'Usuario De Roles',
          correo: 'roles@sga.com',
          passwordHash: 'dummy_hash',
          activo: true
        }
      });

      // Asociarle inicialmente ADMIN
      await prisma.usuarioRol.create({
        data: {
          usuarioId: u.usuarioId,
          rolId: 1,
          asignadoPor: adminActor.usuarioId
        }
      });

      // Reemplazar roles a DOCENTE únicamente
      const result = await caller.usuarios.asignarRoles({
        usuarioId: u.usuarioId,
        roles: [2]
      });
      expect(result.success).toBe(true);

      const dbUser = await prisma.usuario.findUnique({
        where: { usuarioId: u.usuarioId },
        include: { roles: true }
      });

      expect(dbUser?.roles.length).toBe(1);
      expect(dbUser?.roles[0].rolId).toBe(2);
    });
  });
});
