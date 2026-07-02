import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { 
  type GetCalificacionesGrupoInput, 
  type GetCalificacionesAlumnoInput, 
  type UpsertCalificacionInput, 
  type DeleteCalificacionInput 
} from './calificaciones.schema';

export class CalificacionesService {
  /**
   * Obtiene las calificaciones de un grupo (boleta del maestro)
   */
  static async getCalificacionesGrupo(input: GetCalificacionesGrupoInput) {
    return prisma.calificacion.findMany({
      where: {
        grupoMateriaId: input.grupoMateriaId,
        ...(input.periodoId && { periodoId: input.periodoId }),
        alumno: { eliminadoEn: null } // Solo alumnos activos
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
          include: {
            materia: true
          }
        }
      },
      orderBy: [
        { periodoId: 'asc' },
        { alumno: { nombreCompleto: 'asc' } }
      ]
    });
  }

  /**
   * Obtiene el kárdex/boleta de un alumno específico
   */
  static async getCalificacionesAlumno(input: GetCalificacionesAlumnoInput) {
    return prisma.calificacion.findMany({
      where: {
        alumnoId: input.alumnoId
      },
      include: {
        grupoMateria: {
          include: {
            materia: true,
            grupo: true
          }
        },
        registrador: {
          select: {
            nombreUsuario: true
          }
        }
      },
      orderBy: [
        { grupoMateria: { grupo: { cicloId: 'desc' } } },
        { periodoId: 'asc' },
        { grupoMateria: { materia: { nombre: 'asc' } } }
      ]
    });
  }

  /**
   * Registra o actualiza una calificación (Upsert lógico)
   */
  static async upsertCalificacion(input: UpsertCalificacionInput, registradorId: number) {
    // Validar que exista el alumno y el grupo materia
    const [alumno, grupoMateria] = await Promise.all([
      prisma.alumno.findUnique({ where: { alumnoId: input.alumnoId } }),
      prisma.grupoMateria.findUnique({ where: { grupoMateriaId: input.grupoMateriaId } })
    ]);

    if (!alumno || alumno.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado o inactivo' });
    }

    if (!grupoMateria) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Materia/Grupo no encontrado' });
    }

    // Buscar si ya existe una calificación para ese alumno, materia y periodo
    const existente = await prisma.calificacion.findFirst({
      where: {
        alumnoId: input.alumnoId,
        grupoMateriaId: input.grupoMateriaId,
        periodoId: input.periodoId,
        tipoEvaluacion: input.tipoEvaluacion
      }
    });

    if (existente) {
      // Update
      return prisma.calificacion.update({
        where: { calificacionId: existente.calificacionId },
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
    } else {
      // Create
      return prisma.calificacion.create({
        data: {
          ...input,
          registradaPor: registradorId
        }
      });
    }
  }

  /**
   * Elimina una calificación (Hard delete, dado que no hay eliminadoEn en Calificacion)
   */
  static async deleteCalificacion(input: DeleteCalificacionInput) {
    // Como Calificacion no tiene columna eliminadoEn, hacemos delete real
    // Asegurarnos de que existe primero
    const calif = await prisma.calificacion.findUnique({
      where: { calificacionId: input.calificacionId }
    });

    if (!calif) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Calificación no encontrada' });
    }

    return prisma.calificacion.delete({
      where: { calificacionId: input.calificacionId }
    });
  }
}
