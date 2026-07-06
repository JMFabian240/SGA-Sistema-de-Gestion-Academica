import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { 
  type CreatePlanPagoInput, type UpdatePlanPagoInput, 
  type CreateVentanaInscripcionInput, type UpdateVentanaInscripcionInput, 
  type CreateInscripcionInput, type UpdateInscripcionInput 
} from './inscripciones.schema';

export class InscripcionesService {
  // --- Planes de Pago ---
  static async getPlanesPago() {
    return prisma.planPago.findMany({
      where: { eliminadoEn: null },
      orderBy: { creadoEn: 'desc' }
    });
  }

  static async createPlanPago(input: CreatePlanPagoInput) {
    return prisma.planPago.create({ data: input });
  }

  static async updatePlanPago(input: UpdatePlanPagoInput) {
    const { planPagoId, ...data } = input;
    return prisma.planPago.update({
      where: { planPagoId },
      data: { ...data, actualizadoEn: new Date() }
    });
  }

  static async deletePlanPago(planPagoId: number) {
    return prisma.planPago.update({
      where: { planPagoId },
      data: { eliminadoEn: new Date(), activo: false }
    });
  }

  // --- Ventanas de Inscripción Temprana ---
  static async getVentanas() {
    return prisma.ventanaInscripcionTemprana.findMany({
      where: { eliminadoEn: null },
      include: { ciclo: true, beca: true },
      orderBy: { fechaInicio: 'desc' }
    });
  }

  static async createVentana(input: CreateVentanaInscripcionInput) {
    return prisma.ventanaInscripcionTemprana.create({
      data: {
        ...input,
        fechaInicio: new Date(input.fechaInicio),
        fechaFin: new Date(input.fechaFin)
      }
    });
  }

  static async updateVentana(input: UpdateVentanaInscripcionInput) {
    const { ventanaId, fechaInicio, fechaFin, ...data } = input;
    return prisma.ventanaInscripcionTemprana.update({
      where: { ventanaId },
      data: {
        ...data,
        ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
        ...(fechaFin && { fechaFin: new Date(fechaFin) }),
        actualizadoEn: new Date()
      }
    });
  }

  static async deleteVentana(ventanaId: number) {
    return prisma.ventanaInscripcionTemprana.update({
      where: { ventanaId },
      data: { eliminadoEn: new Date(), activa: false }
    });
  }

  // --- Inscripciones de Alumnos ---
  static async getInscripciones(cicloId?: number) {
    return prisma.inscripcionCiclo.findMany({
      where: {
        eliminadoEn: null,
        ...(cicloId && { cicloId })
      },
      include: {
        alumno: true,
        grupo: true,
        planPago: true
      },
      orderBy: { fechaIngreso: 'desc' }
    });
  }

  static async createInscripcion(input: CreateInscripcionInput) {
    // Validar si el alumno ya está inscrito en este ciclo
    const existente = await prisma.inscripcionCiclo.findUnique({
      where: {
        alumnoId_cicloId: {
          alumnoId: input.alumnoId,
          cicloId: input.cicloId
        }
      }
    });

    if (existente && !existente.eliminadoEn) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El alumno ya se encuentra inscrito en este ciclo escolar.'
      });
    }

    // Validar cupo del grupo si se proporciona grupoId
    if (input.grupoId) {
      const grupo = await prisma.grupo.findUnique({
        where: { grupoId: input.grupoId },
        include: {
          inscripciones: {
            where: { eliminadoEn: null }
          }
        }
      });

      if (!grupo || grupo.eliminadoEn) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'El grupo seleccionado no existe o ha sido eliminado.'
        });
      }

      if (grupo.inscripciones.length >= grupo.cupoMaximo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `El grupo ${grupo.nombre} ya ha alcanzado su cupo máximo de ${grupo.cupoMaximo} alumnos.`
        });
      }
    }

    return prisma.inscripcionCiclo.create({
      data: {
        ...input,
        fechaIngreso: new Date(input.fechaIngreso)
      },
      include: {
        alumno: true,
        grupo: true
      }
    });
  }

  static async updateInscripcion(input: UpdateInscripcionInput) {
    const { inscripcionId, fechaIngreso, ...data } = input;
    
    // Verificamos si la inscripción existe y no está eliminada
    const inscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId }
    });

    if (!inscripcion || inscripcion.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada' });
    }

    return prisma.inscripcionCiclo.update({
      where: { inscripcionId },
      data: {
        ...data,
        ...(fechaIngreso && { fechaIngreso: new Date(fechaIngreso) }),
        actualizadoEn: new Date()
      }
    });
  }

  static async deleteInscripcion(inscripcionId: number) {
    // Soft delete de la inscripción (equiparable a anular la matrícula)
    return prisma.inscripcionCiclo.update({
      where: { inscripcionId },
      data: { 
        eliminadoEn: new Date(),
        estadoEnCiclo: 'ANULADA'
      }
    });
  }
}
