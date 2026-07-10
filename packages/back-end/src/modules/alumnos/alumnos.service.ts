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

    const { fechaNacimiento, personasAutorizadas, gradoId, grupoId, ...rest } = input;

    return prisma.$transaction(async (tx) => {
      // 1. Crear el alumno básico
      const alumno = await tx.alumno.create({
        data: {
          ...rest,
          fechaNacimiento: new Date(fechaNacimiento),
          personasAutorizadas: personasAutorizadas ?? null,
          gradoId: gradoId || null
        } as any
      });

      // 2. Si hay grado y grupo, intentar inscribir al ciclo activo
      if (gradoId && grupoId) {
        const nivel = await tx.nivelEducativo.findUnique({
          where: { nivelId: input.nivelId }
        });
        const periodicidad = nivel?.codigo === 'BAC' ? 'SEMESTRAL' : 'ANUAL';

        const cicloActivo = await tx.cicloEscolar.findFirst({
          where: { activo: true, eliminadoEn: null, periodicidad },
          orderBy: { fechaInicio: 'desc' }
        });

        if (cicloActivo) {
          // Crear la inscripción académica sin plan de pagos financiero
          await tx.inscripcionCiclo.create({
            data: {
              alumnoId: alumno.alumnoId,
              cicloId: cicloActivo.cicloId,
              grupoId: grupoId,
              fechaIngreso: new Date(),
              estadoEnCiclo: 'INSCRITO',
              estadoFinanciero: 'NO_APLICA',
              gradoId: gradoId
            }
          });
        }
      }

      return alumno;
    });
  }

  /**
   * Actualiza la información del alumno (incluyendo bajas)
   */
  static async updateAlumno(input: UpdateAlumnoInput) {
    const { alumnoId, fechaNacimiento, fechaBaja, nivelId, gradoId, grupoId, ...data } = input;

    const existing = await AlumnosRepository.getAlumnoDetail(alumnoId);
    if (!existing || existing.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' });
    }

    const updateData: any = {
      ...data,
      ...(fechaNacimiento && { fechaNacimiento: new Date(fechaNacimiento) }),
      ...(fechaBaja && { fechaBaja: new Date(fechaBaja) }),
      actualizadoEn: new Date()
    };

    if (nivelId !== undefined) {
      updateData.nivel = { connect: { nivelId } };
    }
    if (gradoId !== undefined) {
      updateData.grado = { connect: { gradoId } };
    }

    return AlumnosRepository.updateAlumno(alumnoId, updateData);
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
    let finalEsPrincipal = input.esPrincipal;

    // Si no está forzado a true, verificamos si el alumno no tiene a nadie principal. Si no tiene a nadie, forzamos true.
    if (!finalEsPrincipal) {
      const tienePrincipal = await AlumnosRepository.hasTutorPrincipal(input.alumnoId);
      if (!tienePrincipal) {
        finalEsPrincipal = true;
      }
    }

    // Si este será el tutor principal, debemos quitarle la marca a los demás tutores de este alumno
    if (finalEsPrincipal) {
      await AlumnosRepository.removeTutorPrincipalFlag(input.alumnoId);
    }

    // Upsert para manejar el caso donde se reasigna la relación
    const existingRel = await AlumnosRepository.findTutorAlumnoRelation(input.tutorId, input.alumnoId);

    if (existingRel) {
      return AlumnosRepository.updateTutorAlumnoRelation(
        existingRel.tutorAlumnoId, 
        Boolean(finalEsPrincipal), 
        input.parentesco
      );
    }

    return AlumnosRepository.createTutorAlumnoRelation({
      ...input,
      esPrincipal: finalEsPrincipal
    });
  }

  /**
   * Desvincula a un tutor de un alumno
   */
  static async unlinkTutor(input: UnlinkTutorInput) {
    return AlumnosRepository.deleteTutorAlumnoRelation(input.tutorAlumnoId);
  }
}
