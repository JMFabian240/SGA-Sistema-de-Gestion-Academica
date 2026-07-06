import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../src/router';
import { prisma } from '@sga/data-access';
import jwt from 'jsonwebtoken';

describe('Calificaciones Module (Functional)', () => {
  let caller: any;
  let adminActor: any;
  let validToken: string;
  let studentMock: any;
  let cycleMock: any;
  let levelMock: any;
  let groupMock: any;
  let subjectMock: any;
  let groupSubjectMock: any;

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

    // 3. Crear datos base académicos
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

    groupMock = await prisma.grupo.create({
      data: {
        grupoId: 1,
        nivelId: levelMock.nivelId,
        cicloId: cycleMock.cicloId,
        nombre: '1º A',
        cupoMaximo: 30
      }
    });

    subjectMock = await prisma.materia.create({
      data: {
        materiaId: 1,
        nombre: 'Matemáticas I',
        clave: 'MAT-101'
      }
    });

    groupSubjectMock = await prisma.grupoMateria.create({
      data: {
        grupoMateriaId: 1,
        grupoId: groupMock.grupoId,
        materiaId: subjectMock.materiaId,
        docenteId: adminActor.usuarioId
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

  describe('RF-1: Captura y Edición de Calificaciones (Upsert)', () => {
    it('debería crear e incondicionalmente actualizar (Upsert) una calificación', async () => {
      // 1. Crear calificación (Insert)
      const inputCreate = {
        alumnoId: studentMock.alumnoId,
        grupoMateriaId: groupSubjectMock.grupoMateriaId,
        periodoId: 1, // Primer Bimestre
        tipoEvaluacion: 'BIMESTRE' as const,
        valorNumerico: 8.5,
        cuentaParaPromedio: true,
        textoObservacion: 'Buen desempeño',
        textoRecomendacion: 'Seguir practicando'
      };

      const newCalif = await caller.calificaciones.upsert(inputCreate);
      expect(newCalif.calificacionId).toBeDefined();
      expect(Number(newCalif.valorNumerico)).toBe(8.5);
      expect(newCalif.textoObservacion).toBe('Buen desempeño');

      // Verificar en BD que exista exactamente 1
      const count = await prisma.calificacion.count();
      expect(count).toBe(1);

      // 2. Actualizar calificación (Upsert -> Update)
      const inputUpdate = {
        ...inputCreate,
        valorNumerico: 9.2,
        textoObservacion: 'Excelente mejoría'
      };

      const updatedCalif = await caller.calificaciones.upsert(inputUpdate);
      expect(updatedCalif.calificacionId).toBe(newCalif.calificacionId); // Mismo ID
      expect(Number(updatedCalif.valorNumerico)).toBe(9.2); // Actualizado
      expect(updatedCalif.textoObservacion).toBe('Excelente mejoría'); // Actualizado

      // Verificar que siga habiendo solo 1 registro
      const countAfter = await prisma.calificacion.count();
      expect(countAfter).toBe(1);
    });

    it('debería rechazar si el alumno o la materia/grupo no existen', async () => {
      // Alumno inexistente
      await expect(caller.calificaciones.upsert({
        alumnoId: 999,
        grupoMateriaId: groupSubjectMock.grupoMateriaId,
        periodoId: 1,
        tipoEvaluacion: 'BIMESTRE',
        valorNumerico: 7.0
      })).rejects.toThrowError(/Alumno no encontrado o inactivo/);

      // GrupoMateria inexistente
      await expect(caller.calificaciones.upsert({
        alumnoId: studentMock.alumnoId,
        grupoMateriaId: 999,
        periodoId: 1,
        tipoEvaluacion: 'BIMESTRE',
        valorNumerico: 7.0
      })).rejects.toThrowError(/Materia\/Grupo no encontrado/);
    });

    it('debería rechazar si no se proporciona ningún valor (numérico o cualitativo)', async () => {
      await expect(caller.calificaciones.upsert({
        alumnoId: studentMock.alumnoId,
        grupoMateriaId: groupSubjectMock.grupoMateriaId,
        periodoId: 1,
        tipoEvaluacion: 'BIMESTRE'
        // No valorNumerico ni valorCualitativo
      })).rejects.toThrowError(/Debe proporcionar al menos un valor numérico o cualitativo/);
    });
  });

  describe('RF-2: Eliminación Física (Hard Delete)', () => {
    it('debería realizar Hard Delete y lanzar error si no existe', async () => {
      const calif = await prisma.calificacion.create({
        data: {
          alumnoId: studentMock.alumnoId,
          grupoMateriaId: groupSubjectMock.grupoMateriaId,
          periodoId: 1,
          tipoEvaluacion: 'BIMESTRE',
          valorNumerico: 10,
          registradaPor: adminActor.usuarioId
        }
      });

      // 1. Eliminar calificación
      const deleted = await caller.calificaciones.delete({ calificacionId: calif.calificacionId });
      expect(deleted.calificacionId).toBe(calif.calificacionId);

      // Verificar en BD que ya no existe (Hard delete)
      const dbCalif = await prisma.calificacion.findUnique({ where: { calificacionId: calif.calificacionId } });
      expect(dbCalif).toBeNull();

      // 2. Intentar eliminar inexistente (debería lanzar NOT_FOUND)
      await expect(caller.calificaciones.delete({ calificacionId: 999 })).rejects.toThrowError(/Calificación no encontrada/);
    });
  });

  describe('RF-3: Boletas y Kárdex Académico', () => {
    it('debería generar la boleta del ciclo y retornar el kárdex completo del alumno', async () => {
      // Registrar algunas calificaciones
      await prisma.calificacion.createMany({
        data: [
          {
            alumnoId: studentMock.alumnoId,
            grupoMateriaId: groupSubjectMock.grupoMateriaId,
            periodoId: 1,
            tipoEvaluacion: 'BIMESTRE',
            valorNumerico: 9.0,
            registradaPor: adminActor.usuarioId
          },
          {
            alumnoId: studentMock.alumnoId,
            grupoMateriaId: groupSubjectMock.grupoMateriaId,
            periodoId: 2,
            tipoEvaluacion: 'BIMESTRE',
            valorNumerico: 9.5,
            registradaPor: adminActor.usuarioId
          }
        ]
      });

      // 1. Obtener Calificaciones por Grupo (Vista Docente)
      const listGrupo = await caller.calificaciones.getPorGrupo({
        grupoMateriaId: groupSubjectMock.grupoMateriaId
      });
      expect(listGrupo.length).toBe(2);
      expect(Number(listGrupo[0].valorNumerico)).toBe(9.0);

      // 2. Generar Boleta de Calificaciones del Ciclo
      const boleta = await caller.calificaciones.generarBoletaCiclo({
        alumnoId: studentMock.alumnoId,
        cicloId: cycleMock.cicloId
      });
      expect(boleta.alumno.nombreCompleto).toBe('Juan Perez Lopez');
      expect(boleta.ciclo.nombre).toBe('2026-2027');
      expect(boleta.materias.length).toBe(2);
      expect(boleta.materias[0].materia).toBe('Matemáticas I');
      expect(Number(boleta.materias[0].calificacion)).toBe(9.0);

      // 3. Obtener Kárdex Académico Completo
      const kardex = await caller.calificaciones.obtenerKardexCompleto({
        alumnoId: studentMock.alumnoId
      });
      expect(kardex.length).toBe(2);
      expect(kardex[0].ciclo).toBe('2026-2027');
      expect(kardex[0].nivel).toBe('Secundaria');
      expect(kardex[0].materia).toBe('Matemáticas I');
      expect(Number(kardex[0].calificacion)).toBe(9.0);
    });
  });
});
