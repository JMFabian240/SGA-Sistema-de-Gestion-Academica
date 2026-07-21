import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import type { 
  CreatePlanPagoInput, UpdatePlanPagoInput, 
  CreateVentanaInscripcionInput, UpdateVentanaInscripcionInput, 
  CreateInscripcionInput, UpdateInscripcionInput, AsignarPlanPagoInput, QuitarPlanPagoInput,
  GetTarifaColegiaturaInput
} from './inscripciones.schema';
import { InscripcionesRepository } from './inscripciones.repository';
import { CalculadoraPagos } from './inscripciones.utils';

export class InscripcionesService {
  // --- Planes de Pago ---
  static async getPlanesPago() {
    return InscripcionesRepository.getPlanesPago();
  }

  static async createPlanPago(input: CreatePlanPagoInput) {
    return InscripcionesRepository.createPlanPago(input);
  }

  static async updatePlanPago(input: UpdatePlanPagoInput) {
    const { planPagoId, ...data } = input;
    return InscripcionesRepository.updatePlanPago(planPagoId, { ...data, actualizadoEn: new Date() });
  }

  static async deletePlanPago(planPagoId: number) {
    return InscripcionesRepository.deletePlanPago(planPagoId);
  }

  // --- Ventanas de Inscripción Temprana ---
  static async getVentanas() {
    return InscripcionesRepository.getVentanas();
  }

  static async createVentana(input: CreateVentanaInscripcionInput) {
    const { gruposIds, ...rest } = input;
    return InscripcionesRepository.createVentana({
      ...rest,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin)
    }, gruposIds);
  }

  static async updateVentana(input: UpdateVentanaInscripcionInput) {
    const { ventanaId, fechaInicio, fechaFin, gruposIds, ...data } = input;
    return InscripcionesRepository.updateVentana(ventanaId, {
      ...data,
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      actualizadoEn: new Date()
    }, gruposIds);
  }

  static async deleteVentana(ventanaId: number) {
    return InscripcionesRepository.deleteVentana(ventanaId);
  }

  // --- Inscripciones de Alumnos ---
  static async getInscripciones(cicloId?: number) {
    return InscripcionesRepository.getInscripciones(cicloId);
  }

  static async createInscripcion(input: CreateInscripcionInput) {
    const ciclo = await prisma.cicloEscolar.findUnique({ where: { cicloId: input.cicloId } });
    if (ciclo && ciclo.abierto === false) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No se pueden crear inscripciones en un ciclo escolar cerrado.' });
    }

    const existente = await InscripcionesRepository.findInscripcionUnique(input.alumnoId, input.cicloId);

    if (existente && !existente.eliminadoEn) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El alumno ya se encuentra inscrito en este ciclo escolar.'
      });
    }

    // GAP 3: Validar materias reprobadas del ciclo anterior
    const reprobadas = await prisma.calificacion.findFirst({
      where: {
        alumnoId: input.alumnoId,
        OR: [
          { valorNumerico: { lt: 6.0 } },
          { valorCualitativo: 'NA' }
        ]
      }
    });

    if (reprobadas) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'El alumno tiene materias reprobadas y no puede ser inscrito.'
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

    return prisma.$transaction(async (tx) => {
      // 1. Crear Inscripcion Académica
      const inscripcion = await tx.inscripcionCiclo.create({
        data: {
          alumnoId: input.alumnoId,
          cicloId: input.cicloId,
          grupoId: input.grupoId,
          planPagoId: null as any,
          estadoEnCiclo: input.estadoEnCiclo,
          estadoFinanciero: input.estadoFinanciero,
          esIngresoTardio: input.esIngresoTardio,
          fechaIngreso: new Date(input.fechaIngreso)
        },
        include: { alumno: true, grupo: true }
      });

      // 2. Cambiar el estado del alumno a ACTIVO y sincronizar Nivel y Grado
      const updateData: any = {
        estado: 'ACTIVO',
        actualizadoEn: new Date()
      };

      if (inscripcion.grupo) {
        updateData.nivelId = inscripcion.grupo.nivelId;
        updateData.gradoId = inscripcion.grupo.gradoId;
      }

      await tx.alumno.update({
        where: { alumnoId: input.alumnoId },
        data: updateData
      });
      
      return inscripcion;
    });
  }

  static async updateInscripcion(input: UpdateInscripcionInput) {
    const { inscripcionId, fechaIngreso, ...data } = input;
      
    const inscripcion = await InscripcionesRepository.findInscripcionById(inscripcionId);

    if (!inscripcion || inscripcion.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada' });
    }

    if (inscripcion) {
      const ciclo = await prisma.cicloEscolar.findUnique({ where: { cicloId: inscripcion.cicloId } });
      if (ciclo && ciclo.abierto === false) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No se pueden modificar inscripciones de un ciclo escolar cerrado.' });
      }
    }

    return InscripcionesRepository.updateInscripcion(inscripcionId, {
      ...data,
      ...(fechaIngreso && { fechaIngreso: new Date(fechaIngreso) }),
      actualizadoEn: new Date()
    });
  }

  static async asignarPlanPago(input: AsignarPlanPagoInput) {
    const inscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId: input.inscripcionId },
      include: { alumno: true }
    });

    if (!inscripcion || inscripcion.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada.' });
    }

    if (inscripcion.planPagoId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta inscripción ya tiene un plan de pagos asignado.' });
    }

    const planPago = await prisma.planPago.findUnique({ where: { planPagoId: input.planPagoId } });
    if (!planPago || planPago.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan de pago no encontrado.' });
    }

    return prisma.$transaction(async (tx) => {
      // 1. Asignar el plan y estado a la inscripcion
      const inscActualizada = await tx.inscripcionCiclo.update({
        where: { inscripcionId: input.inscripcionId },
        data: { 
          planPagoId: input.planPagoId,
          estadoFinanciero: 'AL_CORRIENTE'
        }
      });

      // 1.5 Buscar todas las Tarifas activas (Colegiatura, Inscripción, etc.)
      const tarifas = await tx.tarifa.findMany({
        where: {
          cicloId: inscripcion.cicloId,
          nivelId: inscripcion.alumno.nivelId,
          activa: true,
          eliminadoEn: null
        }
      });

      const tarifasParaCalculadora = tarifas.map(t => ({
        concepto: t.concepto,
        monto: Number(t.monto)
      }));

      // 2. Generar Adeudos usando CalculadoraPagos
      const planBase = { meses: planPago.meses };
      
      const configGlobal = await tx.configuracionGlobal.findFirst({ where: { configuracionId: 1 } });
      const diaVencimiento = configGlobal?.diaVencimientoMensual || 1;

      const adeudosCalculados = CalculadoraPagos.generarCalendario(planBase, tarifasParaCalculadora, new Date(inscripcion.fechaIngreso), diaVencimiento);
      
      const adeudosParaInsertar = adeudosCalculados.map(a => ({
        alumnoId: inscripcion.alumnoId,
        cicloId: inscripcion.cicloId,
        ...a
      }));
      
      await tx.calendarioPago.createMany({ data: adeudosParaInsertar as any });

      return inscActualizada;
    });
  }

  static async quitarPlanPago(input: QuitarPlanPagoInput) {
    const inscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId: input.inscripcionId }
    });

    if (!inscripcion || inscripcion.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada.' });
    }

    if (!inscripcion.planPagoId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta inscripción no tiene un plan asignado actualmente.' });
    }

    return prisma.$transaction(async (tx) => {
      // 1. Quitar el plan de la inscripción y resetear estado financiero
      const inscActualizada = await tx.inscripcionCiclo.update({
        where: { inscripcionId: input.inscripcionId },
        data: { 
          planPagoId: null as any,
          estadoFinanciero: 'NO_APLICA'
        }
      });

      // 2. Borrar (hard delete para mantener limpia la BD, o soft delete) los adeudos asociados a este ciclo y alumno
      // Dado que estos son generados automáticamente y no deberían tener pagos aplicados si se quiere borrar.
      // Primero verificar si ya hay pagos aplicados
      const pagosConMonto = await tx.calendarioPago.findFirst({
        where: {
          alumnoId: inscripcion.alumnoId,
          cicloId: inscripcion.cicloId,
          montoPagado: { gt: 0 }
        }
      });

      if (pagosConMonto) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No se puede quitar el plan porque ya hay recibos con pagos aplicados. Debes cancelar los pagos primero.' });
      }

      await tx.calendarioPago.deleteMany({
        where: {
          alumnoId: inscripcion.alumnoId,
          cicloId: inscripcion.cicloId
        }
      });

      return inscActualizada;
    });
  }

  static async getTarifaColegiatura(input: GetTarifaColegiaturaInput) {
    const inscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId: input.inscripcionId },
      include: { alumno: true }
    });

    if (!inscripcion) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada' });
    }

    const tarifa = await prisma.tarifa.findFirst({
      where: {
        cicloId: inscripcion.cicloId,
        nivelId: inscripcion.alumno.nivelId,
        concepto: 'COLEGIATURA',
        activa: true,
        eliminadoEn: null
      }
    });

    return tarifa ? Number(tarifa.monto) : 0;
  }

  static async deleteInscripcion(inscripcionId: number) {
    const inscripcion = await InscripcionesRepository.findInscripcionById(inscripcionId);
    if (inscripcion) {
      const ciclo = await prisma.cicloEscolar.findUnique({ where: { cicloId: inscripcion.cicloId } });
      if (ciclo && ciclo.abierto === false) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No se pueden eliminar inscripciones de un ciclo escolar cerrado.' });
      }
    }
    return InscripcionesRepository.deleteInscripcion(inscripcionId);
  }
}
