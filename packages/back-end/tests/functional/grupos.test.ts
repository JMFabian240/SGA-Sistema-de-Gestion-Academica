import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Grupos Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;

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

  describe('RF-1: Niveles Educativos', () => {
    it('debería crear, actualizar, listar ordenadamente y eliminar (Soft Delete) un nivel', async () => {
      // 1. Crear Niveles con diferentes órdenes
      const n2 = await caller.grupos.createNivel({
        codigo: 'PRE',
        nombre: 'Preescolar',
        orden: 2
      });

      const n1 = await caller.grupos.createNivel({
        codigo: 'PRI',
        nombre: 'Primaria',
        orden: 1
      });

      expect(n2.nivelId).toBeDefined();
      expect(n1.nivelId).toBeDefined();

      // 2. Listar Niveles (deberían ordenarse por el campo "orden" de forma ascendente)
      const list = await caller.grupos.getNiveles();
      expect(list.length).toBe(2);
      expect(list[0].codigo).toBe('PRI'); // orden 1 primero
      expect(list[1].codigo).toBe('PRE'); // orden 2 segundo

      // 3. Actualizar Nivel
      const updated = await caller.grupos.updateNivel({
        nivelId: n2.nivelId,
        nombre: 'Kindergarten',
        orden: 3
      });
      expect(updated.nombre).toBe('Kindergarten');
      expect(updated.orden).toBe(3);

      // 4. Eliminar Nivel (Soft Delete)
      const deleted = await caller.grupos.deleteNivel(n1.nivelId);
      expect(deleted.eliminadoEn).not.toBeNull();

      const listAfterDelete = await caller.grupos.getNiveles();
      expect(listAfterDelete.length).toBe(1);
      expect(listAfterDelete[0].nivelId).toBe(n2.nivelId);
    });
  });

  describe('RF-2: Ciclos Escolares y Exclusividad de Activo', () => {
    it('debería inactivar automáticamente otros ciclos activos al activar uno nuevo', async () => {
      // 1. Crear un Ciclo Escolar Activo
      const c1 = await caller.grupos.createCiclo({
        nombre: '2026-Ciclo1',
        fechaInicio: new Date('2026-08-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2027-06-30T00:00:00.000Z').toISOString(),
        activo: true
      });
      expect(c1.activo).toBe(true);

      // 2. Crear un segundo Ciclo Escolar Inicialmente Inactivo
      const c2 = await caller.grupos.createCiclo({
        nombre: '2027-Ciclo2',
        fechaInicio: new Date('2027-08-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2028-06-30T00:00:00.000Z').toISOString(),
        activo: false
      });
      expect(c2.activo).toBe(false);

      // Verificar en base de datos
      let dbC1 = await prisma.cicloEscolar.findUnique({ where: { cicloId: c1.cicloId } });
      let dbC2 = await prisma.cicloEscolar.findUnique({ where: { cicloId: c2.cicloId } });
      expect(dbC1?.activo).toBe(true);
      expect(dbC2?.activo).toBe(false);

      // 3. Actualizar el segundo Ciclo a ACTIVO
      const updatedC2 = await caller.grupos.updateCiclo({
        cicloId: c2.cicloId,
        activo: true
      });
      expect(updatedC2.activo).toBe(true);

      // Verificar que c1 se haya desactivado automáticamente (Regra transaccional)
      dbC1 = await prisma.cicloEscolar.findUnique({ where: { cicloId: c1.cicloId } });
      dbC2 = await prisma.cicloEscolar.findUnique({ where: { cicloId: c2.cicloId } });
      expect(dbC1?.activo).toBe(false);
      expect(dbC2?.activo).toBe(true);

      // 4. Soft Delete
      const deleted = await caller.grupos.deleteCiclo(c2.cicloId);
      expect(deleted.eliminadoEn).not.toBeNull();

      const list = await caller.grupos.getCiclos();
      expect(list.length).toBe(1);
      expect(list[0].cicloId).toBe(c1.cicloId);
    });

    it('debería persistir y actualizar el campo gradosPermitidos en un ciclo escolar', async () => {
      const config = {
        PRI: [1, 2, 3, 4, 5, 6],
        BAC: [1, 3, 5]
      };

      // 1. Crear un Ciclo con gradosPermitidos
      const c = await caller.grupos.createCiclo({
        nombre: '2026-Config',
        fechaInicio: new Date('2026-08-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2027-06-30T00:00:00.000Z').toISOString(),
        activo: true,
        gradosPermitidos: config
      });
      expect(c.gradosPermitidos).toEqual(config);

      // 2. Verificar en la base de datos
      const dbC = await prisma.cicloEscolar.findUnique({ where: { cicloId: c.cicloId } });
      expect(dbC?.gradosPermitidos).toEqual(config);

      // 3. Actualizar gradosPermitidos
      const newConfig = {
        BAC: [2, 4, 6]
      };
      const updated = await caller.grupos.updateCiclo({
        cicloId: c.cicloId,
        gradosPermitidos: newConfig
      });
      expect(updated.gradosPermitidos).toEqual(newConfig);

      const dbUpdated = await prisma.cicloEscolar.findUnique({ where: { cicloId: c.cicloId } });
      expect(dbUpdated?.gradosPermitidos).toEqual(newConfig);
    });

    it('debería soportar la coexistencia de un ciclo activo de cada periodicidad (ANUAL y SEMESTRAL) en paralelo', async () => {
      // 1. Crear un Ciclo Anual Activo
      const anual1 = await caller.grupos.createCiclo({
        nombre: 'Anual-Activo-1',
        fechaInicio: new Date('2026-08-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2027-07-31T00:00:00.000Z').toISOString(),
        activo: true,
        periodicidad: 'ANUAL'
      });
      expect(anual1.activo).toBe(true);

      // 2. Crear un Ciclo Semestral Activo (debería coexistir en paralelo sin desactivar el anual)
      const semestral1 = await caller.grupos.createCiclo({
        nombre: 'Semestral-Activo-1',
        fechaInicio: new Date('2026-08-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2027-01-31T00:00:00.000Z').toISOString(),
        activo: true,
        periodicidad: 'SEMESTRAL'
      });
      expect(semestral1.activo).toBe(true);

      // Verificar en la BD que ambos estén activos en paralelo
      let dbAnual1 = await prisma.cicloEscolar.findUnique({ where: { cicloId: anual1.cicloId } });
      let dbSemestral1 = await prisma.cicloEscolar.findUnique({ where: { cicloId: semestral1.cicloId } });
      expect(dbAnual1?.activo).toBe(true);
      expect(dbSemestral1?.activo).toBe(true);

      // 3. Crear un nuevo Ciclo Anual Activo (debería desactivar anual1 pero mantener semestral1 activo)
      const anual2 = await caller.grupos.createCiclo({
        nombre: 'Anual-Activo-2',
        fechaInicio: new Date('2027-08-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2028-07-31T00:00:00.000Z').toISOString(),
        activo: true,
        periodicidad: 'ANUAL'
      });
      expect(anual2.activo).toBe(true);

      dbAnual1 = await prisma.cicloEscolar.findUnique({ where: { cicloId: anual1.cicloId } });
      let dbAnual2 = await prisma.cicloEscolar.findUnique({ where: { cicloId: anual2.cicloId } });
      dbSemestral1 = await prisma.cicloEscolar.findUnique({ where: { cicloId: semestral1.cicloId } });

      expect(dbAnual1?.activo).toBe(false); // Desactivado por nuevo anual
      expect(dbAnual2?.activo).toBe(true);  // Activo
      expect(dbSemestral1?.activo).toBe(true); // Se mantiene activo por ser de otra periodicidad

      // 4. Crear un Ciclo Semestral Inactivo
      const semestral2 = await caller.grupos.createCiclo({
        nombre: 'Semestral-Inactivo-2',
        fechaInicio: new Date('2027-02-01T00:00:00.000Z').toISOString(),
        fechaFin: new Date('2027-07-31T00:00:00.000Z').toISOString(),
        activo: false,
        periodicidad: 'SEMESTRAL'
      });
      expect(semestral2.activo).toBe(false);

      // 5. Activar semestral2 mediante actualización (debería desactivar semestral1, pero mantener anual2 activo)
      const updatedSemestral2 = await caller.grupos.updateCiclo({
        cicloId: semestral2.cicloId,
        activo: true
      });
      expect(updatedSemestral2.activo).toBe(true);

      dbSemestral1 = await prisma.cicloEscolar.findUnique({ where: { cicloId: semestral1.cicloId } });
      let dbSemestral2 = await prisma.cicloEscolar.findUnique({ where: { cicloId: semestral2.cicloId } });
      dbAnual2 = await prisma.cicloEscolar.findUnique({ where: { cicloId: anual2.cicloId } });

      expect(dbSemestral1?.activo).toBe(false); // Desactivado
      expect(dbSemestral2?.activo).toBe(true);  // Activo
      expect(dbAnual2?.activo).toBe(true);      // Se mantiene activo
    });
  });

  describe('RF-3: Materias', () => {
    it('debería crear, actualizar, listar y eliminar (Soft Delete) materias', async () => {
      // 1. Crear Materia
      const mat = await caller.grupos.createMateria({
        nombre: 'Matemáticas I',
        clave: 'MAT-101'
      });
      expect(mat.materiaId).toBeDefined();

      // 2. Listar
      const list = await caller.grupos.getMaterias();
      expect(list.length).toBe(1);
      expect(list[0].nombre).toBe('Matemáticas I');

      // 3. Actualizar
      const updated = await caller.grupos.updateMateria({
        materiaId: mat.materiaId,
        nombre: 'Cálculo Diferencial'
      });
      expect(updated.nombre).toBe('Cálculo Diferencial');

      // 4. Eliminar
      const deleted = await caller.grupos.deleteMateria(mat.materiaId);
      expect(deleted.eliminadoEn).not.toBeNull();

      const listAfter = await caller.grupos.getMaterias();
      expect(listAfter.length).toBe(0);
    });
  });

  describe('RF-4: Grupos', () => {
    it('debería crear, actualizar, listar y eliminar (Soft Delete) grupos', async () => {
      // Crear nivel y ciclo requeridos
      const lvl = await prisma.nivelEducativo.create({
        data: { nivelId: 1, codigo: 'SEC', nombre: 'Secundaria', orden: 1 }
      });
      const ciclo = await prisma.cicloEscolar.create({
        data: {
          cicloId: 1,
          nombre: '2026',
          fechaInicio: new Date('2026-08-01'),
          fechaFin: new Date('2027-06-30')
        }
      });

      // 1. Crear Grupo
      const gp = await caller.grupos.createGrupo({
        nivelId: lvl.nivelId,
        cicloId: ciclo.cicloId,
        nombre: '1º A',
        cupoMaximo: 35
      });
      expect(gp.grupoId).toBeDefined();
      expect(gp.nombre).toBe('1º A');

      // 2. Listar
      const list = await caller.grupos.getGrupos();
      expect(list.length).toBe(1);
      expect(list[0].nombre).toBe('1º A');
      expect(list[0].nivel.codigo).toBe('SEC');

      // 3. Actualizar
      const updated = await caller.grupos.updateGrupo({
        grupoId: gp.grupoId,
        cupoMaximo: 40
      });
      expect(updated.cupoMaximo).toBe(40);

      // 4. Eliminar
      const deleted = await caller.grupos.deleteGrupo(gp.grupoId);
      expect(deleted.eliminadoEn).not.toBeNull();

      const listAfter = await caller.grupos.getGrupos();
      expect(listAfter.length).toBe(0);
    });
  });

  describe('RF-5: Asignación de Materias a Grupos (Tabla Pivote)', () => {
    it('debería asignar y desasignar (Hard Delete) materias a un grupo', async () => {
      // Crear dependencias
      const lvl = await prisma.nivelEducativo.create({
        data: { nivelId: 1, codigo: 'SEC', nombre: 'Secundaria', orden: 1 }
      });
      const ciclo = await prisma.cicloEscolar.create({
        data: {
          cicloId: 1,
          nombre: '2026',
          fechaInicio: new Date('2026-08-01'),
          fechaFin: new Date('2027-06-30')
        }
      });
      const gp = await prisma.grupo.create({
        data: {
          grupoId: 1,
          nivelId: lvl.nivelId,
          cicloId: ciclo.cicloId,
          nombre: '1º A',
          cupoMaximo: 30
        }
      });
      const mat = await prisma.materia.create({
        data: {
          materiaId: 1,
          nombre: 'Historia Universal',
          clave: 'HIS-101'
        }
      });

      // 1. Asignar Materia a Grupo
      const asignacion = await caller.grupos.assignMateria({
        grupoId: gp.grupoId,
        materiaId: mat.materiaId
        // docenteId es opcional
      });
      expect(asignacion.grupoMateriaId).toBeDefined();
      expect(asignacion.materiaId).toBe(mat.materiaId);
      expect(asignacion.grupoId).toBe(gp.grupoId);

      // Verificar en BD
      const dbAsignacion = await prisma.grupoMateria.findUnique({
        where: { grupoMateriaId: asignacion.grupoMateriaId }
      });
      expect(dbAsignacion).not.toBeNull();

      // 2. Desasignar Materia (Hard Delete de la relación en la tabla pivote)
      const unassign = await caller.grupos.unassignMateria({
        grupoMateriaId: asignacion.grupoMateriaId
      });
      expect(unassign.grupoMateriaId).toBe(asignacion.grupoMateriaId);

      // Verificar remoción física en BD
      const dbAsignacionPost = await prisma.grupoMateria.findUnique({
        where: { grupoMateriaId: asignacion.grupoMateriaId }
      });
      expect(dbAsignacionPost).toBeNull();
    });
  });
});
