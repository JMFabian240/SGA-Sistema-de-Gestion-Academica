import { router, docentProcedure, gestorProcedure } from '../../trpc';
import { z } from 'zod';
import { GruposService } from './grupos.service';
import {
  createNivelEducativoSchema, updateNivelEducativoSchema,
  createGradoSchema, updateGradoSchema,
  createCicloEscolarSchema, updateCicloEscolarSchema,
  createMateriaSchema, updateMateriaSchema,
  createGrupoSchema, updateGrupoSchema,
  assignMateriaGrupoSchema, unassignMateriaGrupoSchema,
  getAlumnosCierreGrupoSchema, cerrarCicloGrupoSchema,
  getGradosParaInicializarSchema, inicializarGruposSeleccionadosSchema
} from './grupos.schema';

export const gruposRouter = router({
  // --- Niveles Educativos ---
  getNiveles: docentProcedure.query(() => GruposService.getNiveles()),
  createNivel: gestorProcedure.input(createNivelEducativoSchema).mutation(({ input }) => GruposService.createNivel(input)),
  updateNivel: gestorProcedure.input(updateNivelEducativoSchema).mutation(({ input }) => GruposService.updateNivel(input)),
  deleteNivel: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteNivel(input)),

  // --- Grados ---
  getGrados: docentProcedure.query(() => GruposService.getGrados()),
  createGrado: gestorProcedure.input(createGradoSchema).mutation(({ input }) => GruposService.createGrado(input)),
  updateGrado: gestorProcedure.input(updateGradoSchema).mutation(({ input }) => GruposService.updateGrado(input)),
  deleteGrado: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteGrado(input)),

  // --- Ciclos Escolares ---
  getCiclos: docentProcedure.query(() => GruposService.getCiclos()),
  createCiclo: gestorProcedure.input(createCicloEscolarSchema).mutation(({ input }) => GruposService.createCiclo(input)),
  updateCiclo: gestorProcedure.input(updateCicloEscolarSchema).mutation(({ input }) => GruposService.updateCiclo(input)),
  deleteCiclo: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteCiclo(input)),

  // --- Materias ---
  getMaterias: docentProcedure.query(() => GruposService.getMaterias()),
  createMateria: gestorProcedure.input(createMateriaSchema).mutation(({ input }) => GruposService.createMateria(input)),
  updateMateria: gestorProcedure.input(updateMateriaSchema).mutation(({ input }) => GruposService.updateMateria(input)),
  deleteMateria: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteMateria(input)),

  // --- Grupos ---
  getGrupos: docentProcedure
    .input(z.object({ cicloId: z.number().int().positive().optional() }).optional())
    .query(({ input }) => GruposService.getGrupos(input?.cicloId)),
  createGrupo: gestorProcedure.input(createGrupoSchema).mutation(({ input }) => GruposService.createGrupo(input)),
  updateGrupo: gestorProcedure.input(updateGrupoSchema).mutation(({ input }) => GruposService.updateGrupo(input)),
  deleteGrupo: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteGrupo(input)),

  // --- Asignación Materias a Grupos ---
  assignMateria: gestorProcedure.input(assignMateriaGrupoSchema).mutation(({ input }) => GruposService.assignMateriaToGrupo(input)),
  unassignMateria: gestorProcedure.input(unassignMateriaGrupoSchema).mutation(({ input }) => GruposService.unassignMateriaFromGrupo(input)),
  getAlumnosCierreGrupo: gestorProcedure.input(getAlumnosCierreGrupoSchema).query(({ input }) => GruposService.getAlumnosCierreGrupo(input.grupoId)),
  cerrarCicloGrupo: gestorProcedure.input(cerrarCicloGrupoSchema).mutation(({ input }) => GruposService.cerrarCicloGrupo(input)),

  // --- Inicialización Selectiva de Grupos ---
  getGradosParaInicializar: docentProcedure
    .input(getGradosParaInicializarSchema)
    .query(({ input }) => GruposService.getGradosParaInicializar(input.cicloId)),
  inicializarGruposSeleccionados: gestorProcedure
    .input(inicializarGruposSeleccionadosSchema)
    .mutation(({ input }) => GruposService.inicializarGruposSeleccionados(input)),
});
