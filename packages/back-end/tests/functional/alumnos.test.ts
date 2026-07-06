import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Alumnos Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;
  let levelMock: any;
  let tutorMock: any;

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

    // 2. Crear usuario administrador (actor)
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

    await prisma.usuarioRol.create({
      data: {
        usuarioId: adminActor.usuarioId,
        rolId: adminRol.rolId,
        asignadoPor: adminActor.usuarioId
      }
    });

    // 3. Crear datos base
    levelMock = await prisma.nivelEducativo.create({
      data: {
        nivelId: 1,
        codigo: 'SEC',
        nombre: 'Secundaria',
        orden: 1
      }
    });

    tutorMock = await prisma.tutor.create({
      data: {
        tutorId: 1,
        nombreCompleto: 'Juan Perez Padre',
        correoElectronico: 'juan.perez@tutor.com',
        telefono: '5551234567',
        saldoAFavor: 0
      }
    });

    // Generar token JWT firmado
    validToken = jwt.sign(
      { usuarioId: adminActor.usuarioId, jti: 'test-jti-uuid' },
      process.env.JWT_SECRET || 'supersecret'
    );

    const ctx = {
      req: { headers: {}, ip: '127.0.0.1' } as any,
      res: {} as any,
      prisma,
      token: validToken
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('RF-1: Catálogo de Alumnos', () => {
    it('debería crear, actualizar, obtener detalles y borrar lógicamente un alumno', async () => {
      // 1. Crear Alumno
      const student = await caller.alumnos.create({
        nombreCompleto: 'Carlos Slim Helu',
        matricula: 'MAT-2026-9999',
        curp: 'SLIC800101HDFRRN01',
        sexo: 'M',
        fechaNacimiento: new Date('1980-01-01T00:00:00.000Z').toISOString(),
        nivelId: levelMock.nivelId,
        estado: 'ACTIVO',
        diaLimitePago: 10,
        tipoSangre: 'A+'
      });

      expect(student.alumnoId).toBeDefined();
      expect(student.nombreCompleto).toBe('Carlos Slim Helu');

      // 2. Intentar duplicar CURP (debería lanzar BAD_REQUEST)
      await expect(caller.alumnos.create({
        nombreCompleto: 'Duplicado Curp',
        matricula: 'MAT-2026-8888',
        curp: 'SLIC800101HDFRRN01', // CURP idéntica
        sexo: 'M',
        fechaNacimiento: new Date('1985-05-05T00:00:00.000Z').toISOString(),
        nivelId: levelMock.nivelId,
        estado: 'ACTIVO'
      })).rejects.toThrowError(/Ya existe un alumno con ese CURP o Matrícula/);

      // 3. Obtener listado de alumnos activos (ordenados alfabéticamente)
      const list = await caller.alumnos.getAll();
      expect(list.length).toBe(1);
      expect(list[0].nombreCompleto).toBe('Carlos Slim Helu');

      // 4. Obtener detalle de alumno
      const detail = await caller.alumnos.getById(student.alumnoId);
      expect(detail.alumnoId).toBe(student.alumnoId);
      expect(detail.nivel.codigo).toBe('SEC');

      // 5. Actualizar información del alumno
      const updated = await caller.alumnos.update({
        alumnoId: student.alumnoId,
        nombreCompleto: 'Carlos Slim Helu Modificado',
        tipoSangre: 'O-'
      });
      expect(updated.nombreCompleto).toBe('Carlos Slim Helu Modificado');
      expect(updated.tipoSangre).toBe('O-');

      // 6. Soft Delete del Alumno
      const deleted = await caller.alumnos.delete(student.alumnoId);
      expect(deleted.eliminadoEn).not.toBeNull();
      expect(deleted.estado).toBe('BAJA_DEFINITIVA');

      // Verificar que ya no aparezca en activos
      const listAfter = await caller.alumnos.getAll();
      expect(listAfter.length).toBe(0);

      // Obtener por ID debería arrojar NOT_FOUND
      await expect(caller.alumnos.getById(student.alumnoId)).rejects.toThrowError(/Alumno no encontrado/);
    });
  });

  describe('RF-2: Relación Alumno - Tutor y Exclusividad de Tutor Principal', () => {
    it('debería vincular, actualizar, remover marcas principales atómicamente y desvincular un tutor', async () => {
      // Crear Alumno en DB
      const student = await prisma.alumno.create({
        data: {
          alumnoId: 1,
          nombreCompleto: 'Maria Perez Lopez',
          matricula: 'MAT-2026-0002',
          fechaNacimiento: new Date('2012-05-15'),
          curp: 'PELM120515MDFRRN02',
          sexo: 'F',
          tipoSangre: 'B+',
          estado: 'ACTIVO',
          nivelId: levelMock.nivelId
        }
      });

      // Crear otro tutor
      const secondTutor = await prisma.tutor.create({
        data: {
          tutorId: 2,
          nombreCompleto: 'Maria Lopez Madre',
          correoElectronico: 'maria.lopez@tutor.com'
        }
      });

      // 1. Vincular primer tutor como PRINCIPAL
      const rel1 = await caller.alumnos.linkTutor({
        alumnoId: student.alumnoId,
        tutorId: tutorMock.tutorId,
        esPrincipal: true,
        parentesco: 'Padre'
      });
      expect(rel1.tutorAlumnoId).toBeDefined();
      expect(rel1.esPrincipal).toBe(true);

      // 2. Vincular segundo tutor como PRINCIPAL (debería desactivar la marca al primero)
      const rel2 = await caller.alumnos.linkTutor({
        alumnoId: student.alumnoId,
        tutorId: secondTutor.tutorId,
        esPrincipal: true,
        parentesco: 'Madre'
      });
      expect(rel2.esPrincipal).toBe(true);

      // Verificar en BD que el tutorMock ya no es principal
      const dbRel1 = await prisma.tutorAlumno.findUnique({ where: { tutorAlumnoId: rel1.tutorAlumnoId } });
      expect(dbRel1?.esPrincipal).toBe(false); // Removido automáticamente

      // 3. Actualizar relación existente (cambiar parentesco)
      const relUpdated = await caller.alumnos.linkTutor({
        alumnoId: student.alumnoId,
        tutorId: tutorMock.tutorId,
        parentesco: 'Tío' // Actualización de relación existente
      });
      expect(relUpdated.parentesco).toBe('Tío');

      // 4. Desvincular Tutor (Hard Delete de la relación pivote)
      const unlinked = await caller.alumnos.unlinkTutor({
        tutorAlumnoId: rel1.tutorAlumnoId
      });
      expect(unlinked.tutorAlumnoId).toBe(rel1.tutorAlumnoId);

      const dbRel1Post = await prisma.tutorAlumno.findUnique({ where: { tutorAlumnoId: rel1.tutorAlumnoId } });
      expect(dbRel1Post).toBeNull(); // Eliminado físicamente
    });
  });
});
