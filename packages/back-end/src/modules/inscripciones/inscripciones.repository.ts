import { prisma, Prisma } from '@sga/data-access';

export class InscripcionesRepository {
  // --- Planes de Pago ---
  static async getPlanesPago() {
    return prisma.planPago.findMany({
      where: { eliminadoEn: null },
      orderBy: { creadoEn: 'desc' }
    });
  }

  static async createPlanPago(data: Prisma.PlanPagoCreateInput) {
    return prisma.planPago.create({ data });
  }

  static async updatePlanPago(planPagoId: number, data: Prisma.PlanPagoUpdateInput) {
    return prisma.planPago.update({
      where: { planPagoId },
      data
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
    const ventanas = await prisma.ventanaInscripcionTemprana.findMany({
      where: { eliminadoEn: null },
      include: { 
        ciclo: true, 
        beca: true,
        nivel: true,
        grado: true,
        ventanasGrupo: {
          include: { grupo: true }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    return ventanas.map(v => ({
      ...v,
      descuentoInscripcion: v.descuentoInscripcion?.toNumber() || null
    }));
  }

  static async createVentana(data: Prisma.VentanaInscripcionTempranaUncheckedCreateInput, gruposIds?: number[]) {
    return prisma.$transaction(async (tx) => {
      const ventana = await tx.ventanaInscripcionTemprana.create({ data });
      if (gruposIds && gruposIds.length > 0) {
        await tx.ventanaGrupo.createMany({
          data: gruposIds.map(id => ({ ventanaId: ventana.ventanaId, grupoId: id }))
        });
      }
      return ventana;
    });
  }

  static async updateVentana(ventanaId: number, data: Prisma.VentanaInscripcionTempranaUncheckedUpdateInput, gruposIds?: number[]) {
    return prisma.$transaction(async (tx) => {
      const ventana = await tx.ventanaInscripcionTemprana.update({
        where: { ventanaId },
        data
      });
      if (gruposIds !== undefined) {
        await tx.ventanaGrupo.deleteMany({ where: { ventanaId } });
        if (gruposIds.length > 0) {
          await tx.ventanaGrupo.createMany({
            data: gruposIds.map(id => ({ ventanaId: ventana.ventanaId, grupoId: id }))
          });
        }
      }
      return ventana;
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

  static async findInscripcionUnique(alumnoId: number, cicloId: number) {
    return prisma.inscripcionCiclo.findUnique({
      where: {
        alumnoId_cicloId: {
          alumnoId,
          cicloId
        }
      }
    });
  }

  static async findInscripcionById(inscripcionId: number) {
    return prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId }
    });
  }

  static async createInscripcion(data: Prisma.InscripcionCicloUncheckedCreateInput) {
    return prisma.inscripcionCiclo.create({
      data,
      include: {
        alumno: true,
        grupo: true
      }
    });
  }

  static async updateInscripcion(inscripcionId: number, data: Prisma.InscripcionCicloUncheckedUpdateInput) {
    return prisma.inscripcionCiclo.update({
      where: { inscripcionId },
      data
    });
  }

  static async deleteInscripcion(inscripcionId: number) {
    return prisma.inscripcionCiclo.update({
      where: { inscripcionId },
      data: { 
        eliminadoEn: new Date(),
        estadoEnCiclo: 'ANULADA'
      }
    });
  }
}
