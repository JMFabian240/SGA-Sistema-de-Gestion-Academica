import { prisma, Prisma } from '@sga/data-access';

export class TutoresRepository {
  static async getTutoresActivos() {
    return prisma.tutor.findMany({
      where: { eliminadoEn: null },
      include: {
        datosFiscales: true
      },
      orderBy: { nombreCompleto: 'asc' }
    });
  }

  static async findTutorById(tutorId: number) {
    return prisma.tutor.findUnique({
      where: { tutorId }
    });
  }

  static async findTutorDetail(tutorId: number) {
    return prisma.tutor.findUnique({
      where: { tutorId },
      include: {
        datosFiscales: true,
        tutoresAlumnos: {
          include: {
            alumno: true
          }
        }
      }
    });
  }

  static async findDatosFiscalesUnique(tutorId: number) {
    return prisma.datosFiscales.findUnique({
      where: { tutorId }
    });
  }

  static async createTutor(data: Prisma.TutorCreateInput) {
    return prisma.tutor.create({
      data,
      include: {
        datosFiscales: true
      }
    });
  }

  static async updateTutor(tutorId: number, data: Prisma.TutorUpdateInput) {
    return prisma.tutor.update({
      where: { tutorId },
      data,
      include: {
        datosFiscales: true
      }
    });
  }

  static async deleteTutor(tutorId: number) {
    return prisma.tutor.update({
      where: { tutorId },
      data: {
        eliminadoEn: new Date(),
        activo: false
      }
    });
  }
}
