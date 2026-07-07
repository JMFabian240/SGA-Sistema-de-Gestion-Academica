import { TRPCError } from '@trpc/server';
import { CalificacionesRepository } from './calificaciones.repository';
import { prisma } from '@sga/data-access';
import type { 
  GetCalificacionesGrupoInput, 
  GetCalificacionesAlumnoInput, 
  UpsertCalificacionInput, 
  DeleteCalificacionInput,
  GenerarBoletaInput,
  KardexInput
} from './calificaciones.schema';

export class CalificacionesService {
  static async getCalificacionesGrupo(input: GetCalificacionesGrupoInput) {
    return CalificacionesRepository.getCalificacionesGrupo(input);
  }

  static async getCalificacionesAlumno(input: GetCalificacionesAlumnoInput) {
    return CalificacionesRepository.getCalificacionesAlumno(input);
  }

  static async upsertCalificacion(input: UpsertCalificacionInput, registradorId: number) {
    const [alumno, grupoMateria] = await Promise.all([
      CalificacionesRepository.findAlumno(input.alumnoId),
      CalificacionesRepository.findGrupoMateria(input.grupoMateriaId)
    ]);

    if (!alumno || alumno.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado o inactivo' });
    }

    if (!grupoMateria) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Materia/Grupo no encontrado' });
    }

    // Verificar si el grupo está cerrado
    const grupo = await prisma.grupo.findUnique({
      where: { grupoId: grupoMateria.grupoId },
      select: { cerrado: true } as any
    }) as any;
    if (grupo?.cerrado) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se pueden modificar calificaciones de un grupo cuyo ciclo escolar ya está cerrado.'
      });
    }

    const existente = await CalificacionesRepository.findCalificacionExistente(
      input.alumnoId, 
      input.grupoMateriaId, 
      input.periodoId, 
      input.tipoEvaluacion
    );

    if (existente) {
      return CalificacionesRepository.updateCalificacion(existente.calificacionId, input, registradorId);
    } else {
      return CalificacionesRepository.createCalificacion(input, registradorId);
    }
  }

  static async deleteCalificacion(input: DeleteCalificacionInput) {
    const calif = await CalificacionesRepository.findCalificacion(input.calificacionId);

    if (!calif) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Calificación no encontrada' });
    }

    const grupoMateria = await CalificacionesRepository.findGrupoMateria(calif.grupoMateriaId);
    if (grupoMateria) {
      const grupo = await prisma.grupo.findUnique({
        where: { grupoId: grupoMateria.grupoId },
        select: { cerrado: true } as any
      }) as any;
      if (grupo?.cerrado) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No se pueden eliminar calificaciones de un grupo cuyo ciclo escolar ya está cerrado.'
        });
      }
    }

    // Encapsulando el Hard Delete
    return CalificacionesRepository.deleteCalificacion(input.calificacionId);
  }

  static async generarBoletaCiclo(input: GenerarBoletaInput) {
    const alumno = await CalificacionesRepository.findAlumnoWithNivel(input.alumnoId);
    const ciclo = await CalificacionesRepository.findCiclo(input.cicloId);
    const calificaciones = await CalificacionesRepository.getCalificacionesParaBoleta(input.alumnoId, input.cicloId);

    return {
      alumno,
      ciclo,
      materias: calificaciones.map(c => ({
        materia: c.grupoMateria.materia.nombre,
        evaluacion: c.tipoEvaluacion,
        calificacion: c.valorNumerico || c.valorCualitativo,
      }))
    };
  }

  static async obtenerKardexCompleto(input: KardexInput) {
    const historial = await CalificacionesRepository.getKardexCompleto(input.alumnoId);

    return historial.map(c => ({
      ciclo: c.grupoMateria.grupo.ciclo.nombre,
      nivel: c.grupoMateria.grupo.nivel.nombre,
      materia: c.grupoMateria.materia.nombre,
      calificacion: c.valorNumerico || c.valorCualitativo,
    }));
  }
}
