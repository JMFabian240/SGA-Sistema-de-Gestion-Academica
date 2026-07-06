import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Becas Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;
  let studentMock: any;
  let cycleMock: any;
  let levelMock: any;

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

    // 3. Crear datos base: Nivel, Alumno, Ciclo Escolar
    levelMock = await prisma.nivelEducativo.create({
      data: {
        nivelId: 1,
        codigo: 'SEC',
        nombre: 'Secundaria',
        orden: 1
      }
    });

    studentMock = await prisma.alumno.create({
      data: {
        alumnoId: 1,
        nombreCompleto: 'Juan Perez Lopez',
        matricula: 'MAT-2026-0001',
        fechaNacimiento: new Date('2010-01-01'),
        curp: 'PELJ100101HDFRRN01',
        sexo: 'M',
        tipoSangre: 'O+',
        estado: 'ACTIVO',
        nivelId: levelMock.nivelId
      }
    });

    cycleMock = await prisma.cicloEscolar.create({
      data: {
        cicloId: 1,
        nombre: '2026-2027',
        fechaInicio: new Date('2026-08-01'),
        fechaFin: new Date('2027-06-30'),
        activo: true
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

  describe('RF-1: Catálogo de Becas', () => {
    it('debería crear, actualizar, listar y eliminar (Soft Delete) una beca', async () => {
      // 1. Crear Beca
      const inputCreate = {
        nombreBeca: 'Beca de Excelencia Académica',
        criterio: 'ACADEMICA' as const,
        porcentaje: 50,
        descripcion: 'Descuento del 50% por promedio sobresaliente'
      };
      const newBeca = await caller.becas.createBeca(inputCreate);
      expect(newBeca.becaId).toBeDefined();
      expect(newBeca.nombreBeca).toBe('Beca de Excelencia Académica');

      // 2. Listar Becas (ordenadas alfabéticamente)
      const list = await caller.becas.getBecas();
      expect(list.length).toBe(1);
      expect(list[0].nombreBeca).toBe('Beca de Excelencia Académica');

      // 3. Actualizar Beca
      const inputUpdate = {
        becaId: newBeca.becaId,
        porcentaje: 60,
        descripcion: 'Descuento del 60% por promedio sobresaliente'
      };
      const updatedBeca = await caller.becas.updateBeca(inputUpdate);
      expect(Number(updatedBeca.porcentaje)).toBe(60);

      // 4. Eliminar Beca (Soft Delete)
      const deleted = await caller.becas.deleteBeca(newBeca.becaId);
      expect(deleted.eliminadoEn).not.toBeNull();

      // Debería desaparecer del listado de becas activas
      const listPostDelete = await caller.becas.getBecas();
      expect(listPostDelete.length).toBe(0);
    });
  });

  describe('RF-2: Solicitudes de Beca', () => {
    it('debería permitir crear solicitudes y rechazar duplicadas para el mismo alumno en el mismo ciclo', async () => {
      // Crear beca de prueba
      const beca = await prisma.beca.create({
        data: {
          becaId: 1,
          nombreBeca: 'Beca Académica',
          criterio: 'ACADEMICA',
          porcentaje: 30
        }
      });

      // 1. Crear solicitud exitosa
      const inputSolicitud = {
        alumnoId: studentMock.alumnoId,
        becaId: beca.becaId,
        cicloId: cycleMock.cicloId,
        motivo: 'Promedio alto',
        observaciones: 'El alumno cumple con todos los requisitos'
      };

      const solicitud = await caller.becas.createSolicitud(inputSolicitud);
      expect(solicitud.solicitudId).toBeDefined();
      expect(solicitud.estado).toBe('ACTIVA');
      expect(solicitud.solicitadaPor).toBe(adminActor.usuarioId);

      // Verificar en listado de solicitudes
      const list = await caller.becas.getSolicitudes({
        alumnoId: studentMock.alumnoId,
        cicloId: cycleMock.cicloId
      });
      expect(list.length).toBe(1);
      expect(list[0].solicitudId).toBe(solicitud.solicitudId);

      // 2. Intentar duplicar solicitud activa (debería lanzar BAD_REQUEST)
      await expect(caller.becas.createSolicitud(inputSolicitud))
        .rejects.toThrowError(/El alumno ya cuenta con una solicitud activa para esta beca en este ciclo/);
    });
  });

  describe('RF-3: Resolución de Solicitudes y Prevención de Duplicados', () => {
    let becaMock: any;
    let solicitudMock: any;

    beforeEach(async () => {
      becaMock = await prisma.beca.create({
        data: {
          becaId: 1,
          nombreBeca: 'Beca de Excelencia',
          criterio: 'ACADEMICA',
          porcentaje: 50
        }
      });

      solicitudMock = await prisma.solicitudBeca.create({
        data: {
          solicitudId: 1,
          alumnoId: studentMock.alumnoId,
          becaId: becaMock.becaId,
          cicloId: cycleMock.cicloId,
          estado: 'ACTIVA',
          solicitadaPor: adminActor.usuarioId
        }
      });
    });

    it('debería cambiar estado a CANCELADA y NO crear asignación al rechazar la solicitud', async () => {
      const result = await caller.becas.resolverSolicitud({
        solicitudId: solicitudMock.solicitudId,
        aprobar: false,
        observacionesResolucion: 'Promedio insuficiente'
      });

      expect(result.solicitud.estado).toBe('CANCELADA');
      expect(result.solicitud.resueltaPor).toBe(adminActor.usuarioId);
      expect(result.solicitud.fechaResolucion).not.toBeNull();
      expect(result.asignacion).toBeNull();

      // Verificar en BD
      const dbAsignaciones = await prisma.asignacionBeca.findMany({
        where: { solicitudId: solicitudMock.solicitudId }
      });
      expect(dbAsignaciones.length).toBe(0);
    });

    it('debería cambiar estado a ACTIVA y crear atómicamente la asignación al aprobar la solicitud', async () => {
      const result = await caller.becas.resolverSolicitud({
        solicitudId: solicitudMock.solicitudId,
        aprobar: true,
        observacionesResolucion: 'Aprobado por el comité académico'
      });

      expect(result.solicitud.estado).toBe('ACTIVA');
      expect(result.solicitud.resueltaPor).toBe(adminActor.usuarioId);
      expect(result.asignacion).not.toBeNull();
      expect(result.asignacion.estado).toBe('ACTIVA');
      expect(result.asignacion.asignadaPor).toBe(adminActor.usuarioId);

      // Verificar existencia en BD
      const dbAsignaciones = await prisma.asignacionBeca.findMany({
        where: { solicitudId: solicitudMock.solicitudId }
      });
      expect(dbAsignaciones.length).toBe(1);
      expect(dbAsignaciones[0].becaId).toBe(becaMock.becaId);
    });

    it('debería prohibir la doble resolución de una solicitud ya aprobada', async () => {
      // 1. Resolver aprobándola
      await caller.becas.resolverSolicitud({
        solicitudId: solicitudMock.solicitudId,
        aprobar: true
      });

      // 2. Intentar resolver de nuevo (debería fallar gracias a la corrección lógica introducida)
      await expect(caller.becas.resolverSolicitud({
        solicitudId: solicitudMock.solicitudId,
        aprobar: false
      })).rejects.toThrowError(/Esta solicitud ya ha sido resuelta o cancelada/);
    });
  });

  describe('RF-4: Asignación Directa de Beca', () => {
    it('debería permitir asignar directamente una beca sin pasar por solicitud', async () => {
      const beca = await prisma.beca.create({
        data: {
          becaId: 1,
          nombreBeca: 'Beca Directa',
          criterio: 'SOCIOECONOMICA',
          porcentaje: 20
        }
      });

      const inputAssign = {
        alumnoId: studentMock.alumnoId,
        becaId: beca.becaId,
        cicloId: cycleMock.cicloId,
        fechaAsignacion: new Date().toISOString(),
        estado: 'ACTIVA' as const
      };

      const result = await caller.becas.assignBeca(inputAssign);
      expect(result.asignacionId).toBeDefined();
      expect(result.estado).toBe('ACTIVA');
      expect(result.asignadaPor).toBe(adminActor.usuarioId);

      // Verificar en BD
      const dbAsignacion = await prisma.asignacionBeca.findUnique({
        where: { asignacionId: result.asignacionId }
      });
      expect(dbAsignacion).not.toBeNull();
      expect(dbAsignacion?.becaId).toBe(beca.becaId);
      expect(dbAsignacion?.alumnoId).toBe(studentMock.alumnoId);
    });
  });
});
