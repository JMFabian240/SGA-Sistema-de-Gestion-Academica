import type {
  CreateNivelEducativoInput, UpdateNivelEducativoInput,
  CreateCicloEscolarInput, UpdateCicloEscolarInput,
  CreateMateriaInput, UpdateMateriaInput,
  CreateGrupoInput, UpdateGrupoInput,
  AssignMateriaGrupoInput, UnassignMateriaGrupoInput
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
    return GruposRepository.getCiclos();
  }

  static async createCiclo(input: CreateCicloEscolarInput) {
    return GruposRepository.createCiclo({
      ...input,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin)
    });
  }

  static async updateCiclo(input: UpdateCicloEscolarInput) {
    const { cicloId, fechaInicio, fechaFin, ...data } = input;
    
    const updateData = {
      ...data,
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      actualizadoEn: new Date()
    };

    if (data.activo) {
      await GruposRepository.updateCicloActivo(cicloId, updateData);
      return GruposRepository.findCiclo(cicloId);
    }

    return GruposRepository.updateCicloDirectly(cicloId, updateData);
  }

  static async deleteCiclo(cicloId: number) {
    return GruposRepository.deleteCiclo(cicloId);
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
}
