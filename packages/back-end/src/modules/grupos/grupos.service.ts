import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import type {
  CreateNivelEducativoInput, UpdateNivelEducativoInput,
  CreateCicloEscolarInput, UpdateCicloEscolarInput,
  CreateMateriaInput, UpdateMateriaInput,
  CreateGrupoInput, UpdateGrupoInput,
  AssignMateriaGrupoInput, UnassignMateriaGrupoInput,
  CerrarCicloGrupoInput
} from './grupos.schema';
import { GruposRepository } from './grupos.repository';

export class GruposService {
  // --- Niveles Educativos ---
  static async getNiveles() {
    return GruposRepository.getNiveles();
  }

  static async createNivel(input: CreateNivelEducativoInput) {
    return GruposRepository.createNivel(input);
  }

  static async updateNivel(input: UpdateNivelEducativoInput) {
    const { nivelId, ...data } = input;
    return GruposRepository.updateNivel(nivelId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteNivel(nivelId: number) {
    return GruposRepository.deleteNivel(nivelId);
  }

  // --- Ciclos Escolares ---
  static async getCiclos() {
    const ciclos = await GruposRepository.getCiclos();
    return ciclos.map(c => ({
      ...c,
      gradosPermitidos: c.gradosPermitidos as Record<string, number[]> | null
    }));
  }

  static async createCiclo(input: CreateCicloEscolarInput) {
    const c = await GruposRepository.createCiclo({
      ...input,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin)
    });
    return {
      ...c,
      gradosPermitidos: c.gradosPermitidos as Record<string, number[]> | null
    };
  }

  static async updateCiclo(input: UpdateCicloEscolarInput) {
    const { cicloId, fechaInicio, fechaFin, ...data } = input;
    
    const updateData = {
      ...data,
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      actualizadoEn: new Date()
    };

    let result;
    if (data.activo) {
      await GruposRepository.updateCicloActivo(cicloId, updateData);
      result = await GruposRepository.findCiclo(cicloId);
    } else {
      result = await GruposRepository.updateCicloDirectly(cicloId, updateData);
    }

    if (!result) return null;
    return {
      ...result,
      gradosPermitidos: result.gradosPermitidos as Record<string, number[]> | null
    };
  }

  static async deleteCiclo(cicloId: number) {
    const deleted = await GruposRepository.deleteCiclo(cicloId);
    return {
      ...deleted,
      gradosPermitidos: deleted.gradosPermitidos as Record<string, number[]> | null
    };
  }

  // --- Materias ---
  static async getMaterias() {
    return GruposRepository.getMaterias();
  }

  static async createMateria(input: CreateMateriaInput) {
    return GruposRepository.createMateria(input);
  }

  static async updateMateria(input: UpdateMateriaInput) {
    const { materiaId, ...data } = input;
    return GruposRepository.updateMateria(materiaId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteMateria(materiaId: number) {
    return GruposRepository.deleteMateria(materiaId);
  }

  // --- Grupos ---
  static async getGrupos(cicloId?: number) {
    return GruposRepository.getGrupos(cicloId);
  }

  static async createGrupo(input: CreateGrupoInput) {
    return GruposRepository.createGrupo(input);
  }

  static async updateGrupo(input: UpdateGrupoInput) {
    const { grupoId, ...data } = input;
    return GruposRepository.updateGrupo(grupoId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteGrupo(grupoId: number) {
    return GruposRepository.deleteGrupo(grupoId);
  }

  // --- Asignación Materias a Grupos ---
  static async assignMateriaToGrupo(input: AssignMateriaGrupoInput) {
    return GruposRepository.assignMateriaToGrupo(input);
  }

  static async unassignMateriaFromGrupo(input: UnassignMateriaGrupoInput) {
    return GruposRepository.unassignMateriaFromGrupo(input.grupoMateriaId);
  }

  // --- Cierre de Ciclo por Grupos ---
  static async getAlumnosCierreGrupo(grupoId: number) {
    const grupo = await GruposRepository.findGrupoWithCiclo(grupoId);
    if (!grupo) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo no encontrado' });
    }

    // Obtener inscripciones de alumnos en este grupo y ciclo
    const inscripciones = await prisma.inscripcionCiclo.findMany({
      where: {
        grupoId,
        cicloId: grupo.cicloId,
        eliminadoEn: null
      },
      include: {
        alumno: true
      }
    });

    const result = [];
    for (const insc of inscripciones) {
      const alumnoId = insc.alumnoId;

      // 1. Verificar si tiene adeudos vencidos
      const adeudos = await prisma.calendarioPago.findMany({
        where: {
          alumnoId,
          cicloId: grupo.cicloId,
          eliminadoEn: null,
          estadoCobro: { in: ['VENCIDO', 'PENDIENTE'] }
        }
      });
      const tieneAdeudo = adeudos.some(a => 
        a.estadoCobro === 'VENCIDO' || 
        (a.estadoCobro === 'PENDIENTE' && new Date(a.fechaVencimiento) < new Date())
      );

      // 2. Verificar si tiene materias reprobadas en este grupo
      const calificaciones = await prisma.calificacion.findMany({
        where: {
          alumnoId,
          grupoMateria: { grupoId }
        }
      });
      const tieneReprobadas = calificaciones.some(c => 
        (c.valorNumerico !== null && Number(c.valorNumerico) < 6.0) || 
        c.valorCualitativo === 'NA'
      );

      result.push({
        alumnoId: insc.alumno.alumnoId,
        matricula: insc.alumno.matricula || '',
        nombreCompleto: insc.alumno.nombreCompleto,
        curp: insc.alumno.curp,
        tieneAdeudo,
        tieneReprobadas
      });
    }

    return result;
  }

  static async cerrarCicloGrupo(input: CerrarCicloGrupoInput) {
    const { grupoId, promociones } = input;
    const grupo = await GruposRepository.findGrupoWithCiclo(grupoId);
    if (!grupo) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo no encontrado' });
    }

    if ((grupo as any).cerrado) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'El ciclo escolar de este grupo ya está cerrado.' });
    }

    // Ejecutar transacción
    return prisma.$transaction(async (tx) => {
      // 1. Marcar el grupo como cerrado
      await tx.grupo.update({
        where: { grupoId },
        data: { cerrado: true, actualizadoEn: new Date() } as any
      });

      // 2. Procesar promociones y estatus de los alumnos
      for (const promo of promociones) {
        const { alumnoId, promover } = promo;

        // Actualizar estatus de inscripción
        await tx.inscripcionCiclo.updateMany({
          where: {
            alumnoId,
            grupoId,
            cicloId: grupo.cicloId,
            eliminadoEn: null
          },
          data: {
            estadoEnCiclo: promover ? 'PROMOVIDO' : 'RETENIDO',
            actualizadoEn: new Date()
          }
        });

        // Actualizar estado general del alumno a TRANSICION_PENDIENTE
        await tx.alumno.update({
          where: { alumnoId },
          data: {
            estado: 'TRANSICION_PENDIENTE',
            actualizadoEn: new Date()
          }
        });
      }

      return { success: true };
    });
  }
}
