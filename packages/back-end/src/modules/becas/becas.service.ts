import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { BecasRepository } from './becas.repository';
import { EstadoBeca } from '@sga/data-access';
import type { 
  CreateBecaInput, UpdateBecaInput, 
  CreateSolicitudBecaInput, ResolverSolicitudBecaInput, 
  AssignBecaInput 
} from './becas.schema';

export class BecasService {
  // --- Catálogo de Becas ---
  static async getBecas() {
    return BecasRepository.getBecasActivas();
  }

  static async createBeca(input: CreateBecaInput) {
    return BecasRepository.createBeca(input);
  }

  static async updateBeca(input: UpdateBecaInput) {
    const { becaId, ...data } = input;
    return BecasRepository.updateBeca(becaId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteBeca(becaId: number) {
    return BecasRepository.deleteBeca(becaId);
  }

  // --- Solicitudes de Beca ---
  static async getSolicitudes(cicloId?: number, alumnoId?: number) {
    return BecasRepository.getSolicitudes(cicloId, alumnoId);
  }

  static async createSolicitud(input: CreateSolicitudBecaInput, solicitadorId: number) {
    const existente = await BecasRepository.findSolicitudActiva(input.alumnoId, input.becaId, input.cicloId);

    if (existente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El alumno ya cuenta con una solicitud activa para esta beca en este ciclo.'
      });
    }

    return BecasRepository.createSolicitud({
      ...input,
      solicitadaPor: solicitadorId,
      estado: 'ACTIVA'
    });
  }

  static async resolverSolicitud(input: ResolverSolicitudBecaInput, resolvedorId: number) {
    const solicitud = await BecasRepository.findSolicitudById(input.solicitudId);

    if (!solicitud || solicitud.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Solicitud no encontrada' });
    }

    if ((solicitud.resueltaPor !== null && solicitud.resueltaPor !== undefined) || solicitud.estado !== 'ACTIVA') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta solicitud ya ha sido resuelta o cancelada' });
    }

    const nuevoEstado = (input.aprobar ? 'ACTIVA' : 'CANCELADA') as EstadoBeca; 

    const solicitudUpdateData = {
      estado: nuevoEstado,
      resueltaPor: resolvedorId,
      fechaResolucion: new Date(),
      observaciones: input.observacionesResolucion
        ? `${solicitud.observaciones ? solicitud.observaciones + '\n' : ''}Resolución: ${input.observacionesResolucion}`
        : solicitud.observaciones,
      actualizadoEn: new Date()
    };

    const asignacionData = input.aprobar ? {
      alumnoId: solicitud.alumnoId,
      becaId: solicitud.becaId,
      cicloId: solicitud.cicloId,
      solicitudId: solicitud.solicitudId,
      estado: 'ACTIVA' as const,
      fechaAsignacion: new Date(),
      asignadaPor: resolvedorId
    } : undefined;

    return BecasRepository.resolverSolicitudConAsignacion(
      input.solicitudId,
      solicitudUpdateData,
      input.aprobar,
      asignacionData
    );
  }

  // --- Asignación Directa de Becas ---
  static async assignBeca(input: AssignBecaInput, asignadorId: number) {
    // 1. Verificar si el alumno existe y no está eliminado
    const alumno = await prisma.alumno.findUnique({
      where: { alumnoId: input.alumnoId }
    });

    if (!alumno || alumno.eliminadoEn) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'El alumno seleccionado no existe o está inactivo.'
      });
    }

    // 2. Verificar si el alumno ya tiene asignada esta beca de forma activa en el mismo ciclo
    const existente = await prisma.asignacionBeca.findFirst({
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
        message: 'El alumno ya cuenta con una asignación activa para esta beca en este ciclo.'
      });
    }

    return BecasRepository.assignBecaDirectamente({
      ...input,
      fechaAsignacion: new Date(input.fechaAsignacion),
      asignadaPor: asignadorId,
      estado: 'ACTIVA'
    });
  }
}
