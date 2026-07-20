import { prisma, TipoEvaluacion } from '@sga/data-access';
import type {
  GetCalificacionesGrupoInput,
  GetCalificacionesAlumnoInput,
  UpsertCalificacionInput
} from './calificaciones.schema';

export class CalificacionesRepository {
  static async getCalificacionesGrupo(input: GetCalificacionesGrupoInput) {
    return prisma.calificacion.findMany({
      where: {
        grupoMateriaId: input.grupoMateriaId,
        ...(input.periodoId && { periodoId: input.periodoId }),
        alumno: { eliminadoEn: null }
      },
      include: {
        alumno: {
          select: {
            alumnoId: true,
            matricula: true,
            nombreCompleto: true
          }
        },
        grupoMateria: {
          include: { materia: true }
        }
      },
      orderBy: [
        { periodoId: 'asc' },
        { alumno: { nombreCompleto: 'asc' } }
      ]
    });
  }

  static async getCalificacionesAlumno(input: GetCalificacionesAlumnoInput) {
    return prisma.calificacion.findMany({
      where: { alumnoId: input.alumnoId },
      include: {
        grupoMateria: {
          include: { materia: true, grupo: true }
        },
        registrador: {
          select: { nombreUsuario: true }
        }
      },
      orderBy: [
        { grupoMateria: { grupo: { cicloId: 'desc' } } },
        { periodoId: 'asc' },
        { grupoMateria: { materia: { nombre: 'asc' } } }
      ]
    });
  }

  static async findAlumno(alumnoId: number) {
    return prisma.alumno.findUnique({ where: { alumnoId } });
  }

  static async findAlumnoWithNivel(alumnoId: number) {
    return prisma.alumno.findUnique({
      where: { alumnoId },
      include: { nivel: true }
    });
  }

  static async findGrupoMateria(grupoMateriaId: number) {
    return prisma.grupoMateria.findUnique({ where: { grupoMateriaId } });
  }

  static async findCiclo(cicloId: number) {
    return prisma.cicloEscolar.findUnique({ where: { cicloId } });
  }

  static async findCalificacionExistente(
    alumnoId: number,
    grupoMateriaId: number,
    periodoId: number | null | undefined,
    tipoEvaluacion: TipoEvaluacion
  ) {
    return prisma.calificacion.findFirst({
      where: {
        alumnoId,
        grupoMateriaId,
        ...(periodoId ? { periodoId } : {}),
        tipoEvaluacion
      }
    });
  }

  static async updateCalificacion(calificacionId: number, input: UpsertCalificacionInput, registradorId: number) {
    return prisma.calificacion.update({
      where: { calificacionId },
      data: {
        valorNumerico: input.valorNumerico,
        valorCualitativo: input.valorCualitativo,
        textoObservacion: input.textoObservacion,
        textoRecomendacion: input.textoRecomendacion,
        cuentaParaPromedio: input.cuentaParaPromedio,
        registradaPor: registradorId,
        actualizadoEn: new Date()
      }
    });
  }

  static async createCalificacion(input: UpsertCalificacionInput, registradorId: number) {
    return prisma.calificacion.create({
      data: {
        ...input,
        registradaPor: registradorId
      }
    });
  }

  static async findCalificacion(calificacionId: number) {
    return prisma.calificacion.findUnique({ where: { calificacionId } });
  }

  static async deleteCalificacion(calificacionId: number) {
    return prisma.calificacion.delete({ where: { calificacionId } });
  }

  static async getCalificacionesParaBoleta(alumnoId: number, cicloId: number) {
    return prisma.calificacion.findMany({
      where: {
        alumnoId,
        grupoMateria: { grupo: { cicloId } }
      },
      include: {
        grupoMateria: { 
          include: { 
            materia: { include: { docente: true } },
            docente: true 
          } 
        }
      }
    });
  }

  static async getKardexCompleto(alumnoId: number) {
    return prisma.calificacion.findMany({
      where: { alumnoId },
      include: {
        grupoMateria: {
          include: {
            materia: true,
            grupo: { include: { ciclo: true, nivel: true } }
          }
        }
      },
      orderBy: { grupoMateria: { grupo: { ciclo: { fechaInicio: 'desc' } } } }
    });
  }
}
