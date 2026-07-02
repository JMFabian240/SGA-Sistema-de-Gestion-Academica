import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import {
  type CreateNivelEducativoInput, type UpdateNivelEducativoInput,
  type CreateCicloEscolarInput, type UpdateCicloEscolarInput,
  type CreateMateriaInput, type UpdateMateriaInput,
  type CreateGrupoInput, type UpdateGrupoInput,
  type AssignMateriaGrupoInput, type UnassignMateriaGrupoInput
} from './grupos.schema';

export class GruposService {
  // --- Niveles Educativos ---
  static async getNiveles() {
    return prisma.nivelEducativo.findMany({
      where: { eliminadoEn: null },
      orderBy: { orden: 'asc' }
    });
  }

  static async createNivel(input: CreateNivelEducativoInput) {
    return prisma.nivelEducativo.create({ data: input });
  }

  static async updateNivel(input: UpdateNivelEducativoInput) {
    const { nivelId, ...data } = input;
    return prisma.nivelEducativo.update({
      where: { nivelId },
      data: { ...data, actualizadoEn: new Date() }
    });
  }

  static async deleteNivel(nivelId: number) {
    return prisma.nivelEducativo.update({
      where: { nivelId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Ciclos Escolares ---
  static async getCiclos() {
    return prisma.cicloEscolar.findMany({
      where: { eliminadoEn: null },
      orderBy: { fechaInicio: 'desc' }
    });
  }

  static async createCiclo(input: CreateCicloEscolarInput) {
    return prisma.cicloEscolar.create({
      data: {
        ...input,
        fechaInicio: new Date(input.fechaInicio),
        fechaFin: new Date(input.fechaFin)
      }
    });
  }

  static async updateCiclo(input: UpdateCicloEscolarInput) {
    const { cicloId, fechaInicio, fechaFin, ...data } = input;
    
    // Si marcamos como activo, debemos desactivar los demás ciclos (Regla de negocio implícita)
    if (data.activo) {
      await prisma.$transaction([
        prisma.cicloEscolar.updateMany({
          where: { activo: true },
          data: { activo: false, actualizadoEn: new Date() }
        }),
        prisma.cicloEscolar.update({
          where: { cicloId },
          data: {
            ...data,
            ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
            ...(fechaFin && { fechaFin: new Date(fechaFin) }),
            actualizadoEn: new Date()
          }
        })
      ]);
      return prisma.cicloEscolar.findUnique({ where: { cicloId } });
    }

    return prisma.cicloEscolar.update({
      where: { cicloId },
      data: {
        ...data,
        ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
        ...(fechaFin && { fechaFin: new Date(fechaFin) }),
        actualizadoEn: new Date()
      }
    });
  }

  static async deleteCiclo(cicloId: number) {
    return prisma.cicloEscolar.update({
      where: { cicloId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Materias ---
  static async getMaterias() {
    return prisma.materia.findMany({
      where: { eliminadoEn: null },
      orderBy: { nombre: 'asc' }
    });
  }

  static async createMateria(input: CreateMateriaInput) {
    return prisma.materia.create({ data: input });
  }

  static async updateMateria(input: UpdateMateriaInput) {
    const { materiaId, ...data } = input;
    return prisma.materia.update({
      where: { materiaId },
      data: { ...data, actualizadoEn: new Date() }
    });
  }

  static async deleteMateria(materiaId: number) {
    return prisma.materia.update({
      where: { materiaId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Grupos ---
  static async getGrupos(cicloId?: number) {
    return prisma.grupo.findMany({
      where: {
        eliminadoEn: null,
        ...(cicloId && { cicloId })
      },
      include: {
        nivel: true,
        ciclo: true,
        materias: {
          include: {
            materia: true,
            docente: true
          }
        }
      },
      orderBy: [
        { nivel: { orden: 'asc' } },
        { nombre: 'asc' }
      ]
    });
  }

  static async createGrupo(input: CreateGrupoInput) {
    return prisma.grupo.create({ data: input });
  }

  static async updateGrupo(input: UpdateGrupoInput) {
    const { grupoId, ...data } = input;
    return prisma.grupo.update({
      where: { grupoId },
      data: { ...data, actualizadoEn: new Date() }
    });
  }

  static async deleteGrupo(grupoId: number) {
    return prisma.grupo.update({
      where: { grupoId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Asignación Materias a Grupos ---
  static async assignMateriaToGrupo(input: AssignMateriaGrupoInput) {
    return prisma.grupoMateria.create({
      data: input,
      include: {
        materia: true,
        docente: true
      }
    });
  }

  static async unassignMateriaFromGrupo(input: UnassignMateriaGrupoInput) {
    return prisma.grupoMateria.delete({
      where: { grupoMateriaId: input.grupoMateriaId }
    });
  }
}
