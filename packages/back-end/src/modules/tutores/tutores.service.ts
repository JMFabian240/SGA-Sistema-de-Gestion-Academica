import type { 
  CreateTutorInput, 
  UpdateTutorInput 
} from './tutores.schema';
import { TRPCError } from '@trpc/server';
import { TutoresRepository } from './tutores.repository';

export class TutoresService {
  /**
   * Obtiene todos los tutores activos.
   */
  static async getTutores() {
    return TutoresRepository.getTutoresActivos();
  }

  /**
   * Obtiene el detalle de un tutor por su ID.
   */
  static async getTutorById(tutorId: number) {
    const tutor = await TutoresRepository.findTutorDetail(tutorId);

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

    if (tutorData.requiereFactura && !datosFiscales) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Se requieren los datos fiscales si se solicita factura'
      });
    }

    return TutoresRepository.createTutor({
      ...tutorData,
      ...(datosFiscales && {
        datosFiscales: {
          create: datosFiscales
        }
      })
    });
  }

  /**
   * Actualiza los datos de un tutor.
   * Si se envían datos fiscales, se aplican vía upsert.
   */
  static async updateTutor(input: UpdateTutorInput) {
    const { tutorId, datosFiscales, ...tutorData } = input;

    const existing = await TutoresRepository.findTutorById(tutorId);
    if (!existing || existing.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Tutor no encontrado' });
    }

    const isRequiereFactura = tutorData.requiereFactura ?? existing.requiereFactura;
    
    if (isRequiereFactura) {
      const hasExistingDatos = await TutoresRepository.findDatosFiscalesUnique(tutorId);
      if (!hasExistingDatos && !datosFiscales) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Faltan los datos fiscales para habilitar la facturación'
        });
      }
    }

    return TutoresRepository.updateTutor(tutorId, {
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
    });
  }

  /**
   * Realiza un borrado lógico del tutor.
   */
  static async deleteTutor(tutorId: number) {
    const tutor = await TutoresRepository.findTutorById(tutorId);
    
    if (tutor && tutor.saldoAFavor && Number(tutor.saldoAFavor) > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar un tutor con saldo a favor activo'
      });
    }

    return TutoresRepository.deleteTutor(tutorId);
  }
}
