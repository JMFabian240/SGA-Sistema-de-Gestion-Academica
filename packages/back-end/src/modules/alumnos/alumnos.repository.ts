import { prisma, Prisma } from '@sga/data-access';
import type { 
  LinkTutorInput 
} from './alumnos.schema';

export class AlumnosRepository {
  static async getAlumnosActivos() {
    return prisma.alumno.findMany({
      where: { eliminadoEn: null },
      include: {
        nivel: true,
        grado: true,
        tutoresAlumnos: {
          where: { esPrincipal: true, tutor: { eliminadoEn: null } },
          include: { tutor: true }
        },
        inscripciones: {
          where: { estadoEnCiclo: 'INSCRITO', ciclo: { activo: true }, eliminadoEn: null },
          include: { 
            grupo: {
              include: { grado: true }
            }
          }
        }
      },
      orderBy: { nombreCompleto: 'asc' }
    });
  }

  static async getAlumnoDetail(alumnoId: number) {
    return prisma.alumno.findUnique({
      where: { alumnoId },
      include: {
        nivel: true,
        grado: true,
        tutoresAlumnos: {
          where: { tutor: { eliminadoEn: null } },
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
            grupo: {
              include: { grado: true }
            },
            planPago: true
          }
        },
        calendariosPagos: {
          orderBy: { fechaVencimiento: 'asc' },
          where: { eliminadoEn: null }
        }
      }
    });
  }

  static async findAlumnoByCurpOrMatricula(curp: string, matricula?: string | null) {
    return prisma.alumno.findFirst({
      where: {
        OR: [
          { curp },
          ...(matricula ? [{ matricula }] : [])
        ]
      }
    });
  }

  static async createAlumno(data: Prisma.AlumnoCreateInput) {
    return prisma.alumno.create({ data });
  }

  static async updateAlumno(alumnoId: number, data: Prisma.AlumnoUpdateInput) {
    return prisma.alumno.update({
      where: { alumnoId },
      data
    });
  }

  static async removeTutorPrincipalFlag(alumnoId: number) {
    return prisma.tutorAlumno.updateMany({
      where: { alumnoId, esPrincipal: true },
      data: { esPrincipal: false }
    });
  }

  static async findTutorAlumnoRelation(tutorId: number, alumnoId: number) {
    return prisma.tutorAlumno.findUnique({
      where: { tutorId_alumnoId: { tutorId, alumnoId } }
    });
  }

  static async hasTutorPrincipal(alumnoId: number) {
    const tutor = await prisma.tutorAlumno.findFirst({
      where: { alumnoId, esPrincipal: true }
    });
    return !!tutor;
  }

  static async updateTutorAlumnoRelation(tutorAlumnoId: number, esPrincipal: boolean, parentesco: string) {
    return prisma.tutorAlumno.update({
      where: { tutorAlumnoId },
      data: { esPrincipal, parentesco }
    });
  }

  static async createTutorAlumnoRelation(input: LinkTutorInput) {
    return prisma.tutorAlumno.create({ data: input });
  }

  static async deleteTutorAlumnoRelation(tutorAlumnoId: number) {
    // Encapsulado el Hard Delete de tabla pivote
    return prisma.tutorAlumno.delete({
      where: { tutorAlumnoId }
    });
  }
}
