import { prisma } from '@sga/data-access';
import { 
  type CreateTutorInput, 
  type UpdateTutorInput, 
  type UpsertDatosFiscalesInput 
} from './tutores.schema';
import { TRPCError } from '@trpc/server';

export class TutoresService {
  /**
   * Obtiene todos los tutores activos.
   */
  static async getTutores() {
    return prisma.tutor.findMany({
      where: { eliminadoEn: null },
      include: {
        datosFiscales: true
      },
      orderBy: { nombreCompleto: 'asc' }
    });
  }

  /**
   * Obtiene el detalle de un tutor por su ID.
   */
  static async getTutorById(tutorId: number) {
    const tutor = await prisma.tutor.findUnique({
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

    if (!tutor || tutor.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Tutor no encontrado' });
    }

    return tutor;
  }

  /**
   * Crea un nuevo tutor.
   * Si incluye datos fiscales, se crean en la misma transacción.
   */
  static async createTutor(input: CreateTutorInput) {
    const { datosFiscales, ...tutorData } = input;

    // Si se requiere factura pero no hay datos fiscales, marcamos error
    if (tutorData.requiereFactura && !datosFiscales) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Se requieren los datos fiscales si se solicita factura'
      });
    }

    return prisma.tutor.create({
      data: {
        ...tutorData,
        ...(datosFiscales && {
          datosFiscales: {
            create: datosFiscales
          }
        })
      },
      include: {
        datosFiscales: true
      }
    });
  }

  /**
   * Actualiza los datos de un tutor.
   * Si se envían datos fiscales, se aplican vía upsert.
   */
  static async updateTutor(input: UpdateTutorInput) {
    const { tutorId, datosFiscales, ...tutorData } = input;

    // Validar que el tutor exista
    const existing = await prisma.tutor.findUnique({ where: { tutorId } });
    if (!existing || existing.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Tutor no encontrado' });
    }

    const isRequiereFactura = tutorData.requiereFactura ?? existing.requiereFactura;
    
    // Validar regla de negocio de facturación
    if (isRequiereFactura) {
      const hasExistingDatos = await prisma.datosFiscales.findUnique({ where: { tutorId } });
      if (!hasExistingDatos && !datosFiscales) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Faltan los datos fiscales para habilitar la facturación'
        });
      }
    }

    return prisma.tutor.update({
      where: { tutorId },
      data: {
        ...tutorData,
        actualizadoEn: new Date(),
        ...(datosFiscales && {
          datosFiscales: {
            upsert: {
              create: datosFiscales,
              update: {
                ...datosFiscales,
                actualizadoEn: new Date()
              }
            }
          }
        })
      },
      include: {
        datosFiscales: true
      }
    });
  }

  /**
   * Realiza un borrado lógico del tutor.
   */
  static async deleteTutor(tutorId: number) {
    // Podríamos validar si el tutor tiene saldo a favor pendiente
    const tutor = await prisma.tutor.findUnique({ where: { tutorId } });
    
    if (tutor && tutor.saldoAFavor && Number(tutor.saldoAFavor) > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar un tutor con saldo a favor activo'
      });
    }

    return prisma.tutor.update({
      where: { tutorId },
      data: {
        eliminadoEn: new Date(),
        activo: false
      }
    });
  }
}
