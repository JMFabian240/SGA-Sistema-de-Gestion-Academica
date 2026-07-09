import { router, protectedProcedure, hasModulePermission } from '../../trpc';
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

const lectura = protectedProcedure.use(hasModulePermission('Grupos', false));
const escritura = protectedProcedure.use(hasModulePermission('Grupos', true));

const lecturaMaterias = protectedProcedure.use(hasModulePermission('Materias', false));
const escrituraMaterias = protectedProcedure.use(hasModulePermission('Materias', true));

export const gruposRouter = router({
  // --- Niveles Educativos ---
  getNiveles: lectura.query(() => GruposService.getNiveles()),
  createNivel: escritura.input(createNivelEducativoSchema).mutation(({ input }) => GruposService.createNivel(input)),
  updateNivel: escritura.input(updateNivelEducativoSchema).mutation(({ input }) => GruposService.updateNivel(input)),
  deleteNivel: escritura.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteNivel(input)),

  // --- Grados ---
  getGrados: lectura.query(() => GruposService.getGrados()),
  createGrado: escritura.input(createGradoSchema).mutation(({ input }) => GruposService.createGrado(input)),
  updateGrado: escritura.input(updateGradoSchema).mutation(({ input }) => GruposService.updateGrado(input)),
  deleteGrado: escritura.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteGrado(input)),

  // --- Ciclos Escolares ---
  getCiclos: lectura.query(() => GruposService.getCiclos()),
  createCiclo: escritura.input(createCicloEscolarSchema).mutation(({ input }) => GruposService.createCiclo(input)),
  updateCiclo: escritura.input(updateCicloEscolarSchema).mutation(({ input }) => GruposService.updateCiclo(input)),
  deleteCiclo: escritura.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteCiclo(input)),

  // --- Materias ---
  getMaterias: lecturaMaterias.query(() => GruposService.getMaterias()),
  getDocentes: lecturaMaterias.query(() => GruposService.getDocentes()),
  createMateria: escrituraMaterias.input(createMateriaSchema).mutation(({ input }) => GruposService.createMateria(input)),
  updateMateria: escrituraMaterias.input(updateMateriaSchema).mutation(({ input }) => GruposService.updateMateria(input)),
  deleteMateria: escrituraMaterias.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteMateria(input)),

  // --- Grupos ---
  getGrupos: lectura
    .input(z.object({ cicloId: z.number().int().positive().optional() }).optional())
    .query(({ input }) => GruposService.getGrupos(input?.cicloId)),
  createGrupo: escritura.input(createGrupoSchema).mutation(({ input }) => GruposService.createGrupo(input)),
  updateGrupo: escritura.input(updateGrupoSchema).mutation(({ input }) => GruposService.updateGrupo(input)),
  deleteGrupo: escritura.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteGrupo(input)),

  // --- Asignación Materias a Grupos ---
  assignMateria: escritura.input(assignMateriaGrupoSchema).mutation(({ input }) => GruposService.assignMateriaToGrupo(input)),
  unassignMateria: escritura.input(unassignMateriaGrupoSchema).mutation(({ input }) => GruposService.unassignMateriaFromGrupo(input)),
  getAlumnosCierreGrupo: escritura.input(getAlumnosCierreGrupoSchema).query(({ input }) => GruposService.getAlumnosCierreGrupo(input.grupoId)),
  cerrarCicloGrupo: escritura.input(cerrarCicloGrupoSchema).mutation(({ input }) => GruposService.cerrarCicloGrupo(input)),

  // --- Inicialización Selectiva de Grupos ---
  getGradosParaInicializar: lectura
    .input(getGradosParaInicializarSchema)
    .query(({ input }) => GruposService.getGradosParaInicializar(input.cicloId)),
  inicializarGruposSeleccionados: escritura
    .input(inicializarGruposSeleccionadosSchema)
    .mutation(({ input }) => GruposService.inicializarGruposSeleccionados(input)),
});
