import { prisma, Prisma } from '@sga/data-access';

export class GruposRepository {
  // --- Niveles Educativos ---
  static async getNiveles() {
    return prisma.nivelEducativo.findMany({
      where: { eliminadoEn: null },
      orderBy: { orden: 'asc' }
    });
  }

  static async createNivel(data: Prisma.NivelEducativoCreateInput) {
    return prisma.nivelEducativo.create({ data });
  }

  static async updateNivel(nivelId: number, data: Prisma.NivelEducativoUpdateInput) {
    return prisma.nivelEducativo.update({
      where: { nivelId },
      data
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

  static async createCiclo(data: Prisma.CicloEscolarUncheckedCreateInput) {
    return prisma.cicloEscolar.create({ data });
  }

  static async updateCicloActivo(cicloId: number, data: Prisma.CicloEscolarUncheckedUpdateInput) {
    return prisma.$transaction([
      prisma.cicloEscolar.updateMany({
        where: { activo: true },
        data: { activo: false, actualizadoEn: new Date() }
      }),
      prisma.cicloEscolar.update({
        where: { cicloId },
        data
      })
    ]);
  }

  static async updateCicloDirectly(cicloId: number, data: Prisma.CicloEscolarUncheckedUpdateInput) {
    return prisma.cicloEscolar.update({
      where: { cicloId },
      data
    });
  }

  static async findCiclo(cicloId: number) {
    return prisma.cicloEscolar.findUnique({ where: { cicloId } });
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

  static async createMateria(data: Prisma.MateriaCreateInput) {
    return prisma.materia.create({ data });
  }

  static async updateMateria(materiaId: number, data: Prisma.MateriaUpdateInput) {
    return prisma.materia.update({
      where: { materiaId },
      data
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

  static async createGrupo(data: Prisma.GrupoUncheckedCreateInput) {
    return prisma.grupo.create({ data });
  }

  static async updateGrupo(grupoId: number, data: Prisma.GrupoUncheckedUpdateInput) {
    return prisma.grupo.update({
      where: { grupoId },
      data
    });
  }

  static async deleteGrupo(grupoId: number) {
    return prisma.grupo.update({
      where: { grupoId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Asignación Materias a Grupos ---
  static async assignMateriaToGrupo(data: Prisma.GrupoMateriaUncheckedCreateInput) {
    return prisma.grupoMateria.create({
      data,
      include: {
        materia: true,
        docente: true
      }
    });
  }

  static async unassignMateriaFromGrupo(grupoMateriaId: number) {
    // Encapsulado el Hard Delete de tabla pivote
    return prisma.grupoMateria.delete({
      where: { grupoMateriaId }
    });
  }
}
