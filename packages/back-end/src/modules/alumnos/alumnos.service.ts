import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { AlumnosRepository } from './alumnos.repository';
import type { 
  CreateAlumnoInput, UpdateAlumnoInput, 
  LinkTutorInput, UnlinkTutorInput 
} from './alumnos.schema';

export class AlumnosService {
  /**
   * Obtiene la lista de alumnos activos
   */
  static async getAlumnos() {
    return AlumnosRepository.getAlumnosActivos();
  }

  /**
   * Obtiene los detalles de un alumno específico
   */
  static async getAlumnoById(alumnoId: number) {
    const alumno = await AlumnosRepository.getAlumnoDetail(alumnoId);

    if (!alumno || alumno.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' });
    }

    return alumno;
  }

  /**
   * Registra a un nuevo alumno
   */
  static async createAlumno(input: CreateAlumnoInput) {
    // Verificar si el CURP o la matrícula ya están en uso
    const existing = await AlumnosRepository.findAlumnoByCurpOrMatricula(input.curp, input.matricula);

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Ya existe un alumno con ese CURP o Matrícula'
      });
    }

    const { fechaNacimiento, personasAutorizadas, ...rest } = input;

    return AlumnosRepository.createAlumno({
      ...rest,
      fechaNacimiento: new Date(fechaNacimiento),
      personasAutorizadas: personasAutorizadas ?? null
    } as any); // Type assertion needed due to Prisma input types vs Schema types
  }

  /**
   * Actualiza la información del alumno (incluyendo bajas)
   */
  static async updateAlumno(input: UpdateAlumnoInput) {
    const { alumnoId, fechaNacimiento, fechaBaja, ...data } = input;

    const existing = await AlumnosRepository.getAlumnoDetail(alumnoId);
    if (!existing || existing.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' });
    }

    return AlumnosRepository.updateAlumno(alumnoId, {
      ...data,
      ...(fechaNacimiento && { fechaNacimiento: new Date(fechaNacimiento) }),
      ...(fechaBaja && { fechaBaja: new Date(fechaBaja) }),
      actualizadoEn: new Date()
    });
  }

  /**
   * Soft Delete de un alumno
   */
  static async deleteAlumno(alumnoId: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Soft delete del alumno
      const alumno = await tx.alumno.update({
        where: { alumnoId },
        data: {
          eliminadoEn: new Date(),
          estado: 'BAJA_DEFINITIVA'
        }
      });

      // 2. Anular matrículas/inscripciones activas en este ciclo escolar
      await tx.inscripcionCiclo.updateMany({
        where: { alumnoId, eliminadoEn: null },
        data: {
          eliminadoEn: new Date(),
          estadoEnCiclo: 'ANULADA'
        }
      });

      // 3. Cancelar y realizar soft delete de los adeudos pendientes del calendario
      await tx.calendarioPago.updateMany({
        where: {
          alumnoId,
          estadoCobro: { in: ['PENDIENTE', 'VENCIDO'] },
          eliminadoEn: null
        },
        data: {
          estadoCobro: 'CANCELADO',
          eliminadoEn: new Date()
        }
      });

      return alumno;
    });
  }

  // --- Relación Alumno - Tutor ---

  /**
   * Vincula un tutor existente con un alumno
   */
  static async linkTutor(input: LinkTutorInput) {
    // Si este será el tutor principal, debemos quitarle la marca a los demás tutores de este alumno
    if (input.esPrincipal) {
      await AlumnosRepository.removeTutorPrincipalFlag(input.alumnoId);
    }

    // Upsert para manejar el caso donde se reasigna la relación
    const existingRel = await AlumnosRepository.findTutorAlumnoRelation(input.tutorId, input.alumnoId);

    if (existingRel) {
      return AlumnosRepository.updateTutorAlumnoRelation(
        existingRel.tutorAlumnoId, 
        Boolean(input.esPrincipal ?? existingRel.esPrincipal), 
        input.parentesco
      );
    }

    return AlumnosRepository.createTutorAlumnoRelation(input);
  }

  /**
   * Desvincula a un tutor de un alumno
   */
  static async unlinkTutor(input: UnlinkTutorInput) {
    return AlumnosRepository.deleteTutorAlumnoRelation(input.tutorAlumnoId);
  }
}
