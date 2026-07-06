import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { 
  type CreateAlumnoInput, type UpdateAlumnoInput, 
  type LinkTutorInput, type UnlinkTutorInput 
} from './alumnos.schema';

export class AlumnosService {
  /**
   * Obtiene la lista de alumnos activos
   */
  static async getAlumnos() {
    return prisma.alumno.findMany({
      where: { eliminadoEn: null },
      include: {
        nivel: true,
        tutoresAlumnos: {
          include: {
            tutor: true
          }
        }
      },
      orderBy: { nombreCompleto: 'asc' }
    });
  }

  /**
   * Obtiene los detalles de un alumno específico
   */
  static async getAlumnoById(alumnoId: number) {
    const alumno = await prisma.alumno.findUnique({
      where: { alumnoId },
      include: {
        nivel: true,
        tutoresAlumnos: {
          include: {
            tutor: {
              include: {
                datosFiscales: true
              }
            }
          }
        },
        inscripciones: {
          include: {
            ciclo: true,
            grupo: true,
            planPago: true
          }
        }
      }
    });

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
    const existing = await prisma.alumno.findFirst({
      where: {
        OR: [
          { curp: input.curp },
          ...(input.matricula ? [{ matricula: input.matricula }] : [])
        ]
      }
    });

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Ya existe un alumno con ese CURP o Matrícula'
      });
    }

    return prisma.alumno.create({
      data: {
        ...input,
        fechaNacimiento: new Date(input.fechaNacimiento),
        personasAutorizadas: input.personasAutorizadas ?? null
      }
    });
  }

  /**
   * Actualiza la información del alumno (incluyendo bajas)
   */
  static async updateAlumno(input: UpdateAlumnoInput) {
    const { alumnoId, fechaNacimiento, fechaBaja, ...data } = input;

    const existing = await prisma.alumno.findUnique({ where: { alumnoId } });
    if (!existing || existing.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' });
    }

    return prisma.alumno.update({
      where: { alumnoId },
      data: {
        ...data,
        ...(fechaNacimiento && { fechaNacimiento: new Date(fechaNacimiento) }),
        ...(fechaBaja && { fechaBaja: new Date(fechaBaja) }),
        actualizadoEn: new Date()
      }
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
      await prisma.tutorAlumno.updateMany({
        where: { alumnoId: input.alumnoId, esPrincipal: true },
        data: { esPrincipal: false }
      });
    }

    // Upsert para manejar el caso donde se reasigna la relación
    const existingRel = await prisma.tutorAlumno.findUnique({
      where: { tutorId_alumnoId: { tutorId: input.tutorId, alumnoId: input.alumnoId } }
    });

    if (existingRel) {
      return prisma.tutorAlumno.update({
        where: { tutorAlumnoId: existingRel.tutorAlumnoId },
        data: {
          esPrincipal: input.esPrincipal ?? existingRel.esPrincipal,
          parentesco: input.parentesco
        }
      });
    }

    return prisma.tutorAlumno.create({
      data: input
    });
  }

  /**
   * Desvincula a un tutor de un alumno
   */
  static async unlinkTutor(input: UnlinkTutorInput) {
    return prisma.tutorAlumno.delete({
      where: { tutorAlumnoId: input.tutorAlumnoId }
    });
  }
}
