import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { 
  CreateBecaInput, UpdateBecaInput, 
  CreateSolicitudBecaInput, ResolverSolicitudBecaInput, 
  AssignBecaInput 
} from './becas.schema';

export class BecasService {
  // --- Catálogo de Becas ---
  static async getBecas() {
    return prisma.beca.findMany({
      where: { eliminadoEn: null },
      orderBy: { nombreBeca: 'asc' }
    });
  }

  static async createBeca(input: CreateBecaInput) {
    return prisma.beca.create({ data: input });
  }

  static async updateBeca(input: UpdateBecaInput) {
    const { becaId, ...data } = input;
    return prisma.beca.update({
      where: { becaId },
      data: { ...data, actualizadoEn: new Date() }
    });
  }

  static async deleteBeca(becaId: number) {
    return prisma.beca.update({
      where: { becaId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Solicitudes de Beca ---
  static async getSolicitudes(cicloId?: number, alumnoId?: number) {
    return prisma.solicitudBeca.findMany({
      where: {
        eliminadoEn: null,
        ...(cicloId && { cicloId }),
        ...(alumnoId && { alumnoId })
      },
      include: {
        alumno: true,
        beca: true,
        ciclo: true,
        solicitador: true,
        resolvedor: true
      },
      orderBy: { fechaSolicitud: 'desc' }
    });
  }

  static async createSolicitud(input: CreateSolicitudBecaInput, solicitadorId: number) {
    // Validar que el alumno no tenga ya una solicitud activa para la misma beca en este ciclo
    const existente = await prisma.solicitudBeca.findFirst({
      where: {
        alumnoId: input.alumnoId,
        becaId: input.becaId,
        cicloId: input.cicloId,
        estado: 'ACTIVA',
        eliminadoEn: null
      }
    });

    if (existente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El alumno ya cuenta con una solicitud activa para esta beca en este ciclo.'
      });
    }

    return prisma.solicitudBeca.create({
      data: {
        ...input,
        solicitadaPor: solicitadorId
      },
      include: {
        beca: true,
        alumno: true
      }
    });
  }

  static async resolverSolicitud(input: ResolverSolicitudBecaInput, resolvedorId: number) {
    const solicitud = await prisma.solicitudBeca.findUnique({
      where: { solicitudId: input.solicitudId }
    });

    if (!solicitud || solicitud.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Solicitud no encontrada' });
    }

    if (solicitud.estado !== 'ACTIVA') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta solicitud ya ha sido resuelta o cancelada' });
    }

    const nuevoEstado = input.aprobar ? 'ACTIVA' : 'CANCELADA'; 
    // Usamos CANCELADA como equivalente a RECHAZADA para acoplarnos al enum EstadoBeca de Prisma

    return prisma.$transaction(async (tx) => {
      // 1. Marcar solicitud como resuelta
      const solicitudResuelta = await tx.solicitudBeca.update({
        where: { solicitudId: input.solicitudId },
        data: {
          estado: nuevoEstado,
          resueltaPor: resolvedorId,
          fechaResolucion: new Date(),
          observaciones: input.observacionesResolucion
            ? `${solicitud.observaciones ? solicitud.observaciones + '\n' : ''}Resolución: ${input.observacionesResolucion}`
            : solicitud.observaciones,
          actualizadoEn: new Date()
        }
      });

      // 2. Si se aprobó, crear la asignación automática
      let asignacion = null;
      if (input.aprobar) {
        asignacion = await tx.asignacionBeca.create({
          data: {
            alumnoId: solicitud.alumnoId,
            becaId: solicitud.becaId,
            cicloId: solicitud.cicloId,
            solicitudId: solicitud.solicitudId,
            estado: 'ACTIVA',
            fechaAsignacion: new Date(),
            asignadaPor: resolvedorId
          }
        });
      }

      return { solicitud: solicitudResuelta, asignacion };
    });
  }

  // --- Asignación Directa de Becas ---
  static async assignBeca(input: AssignBecaInput, asignadorId: number) {
    return prisma.asignacionBeca.create({
      data: {
        ...input,
        fechaAsignacion: new Date(input.fechaAsignacion),
        asignadaPor: asignadorId
      },
      include: {
        beca: true
      }
    });
  }
}
