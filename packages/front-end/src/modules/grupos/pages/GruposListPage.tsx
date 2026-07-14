import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  Layers, 
  Trash2,
  LayoutGrid
} from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { GrupoFormModal } from '../components/GrupoFormModal';
import { AsignarMateriaModal } from '../components/AsignarMateriaModal';

interface CursoSeleccionado {
  gradoId: number;
  numero: number;
  nombre: string;
  nivelId: number;
  nombreNivel: string;
  nivelCodigo: string;
}

export function GruposListPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  // --- Estados de Ciclo y Filtros ---
  const [cursoSeleccionado, setCursoSeleccionado] = useState<CursoSeleccionado | null>(null);
  const [filtroSeccion, setFiltroSeccion] = useState<string>('Todas');

  // --- Modales ---
  const [isAsignarMateriaOpen, setIsAsignarMateriaOpen] = useState(false);
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<any>(null);

  // --- Queries ---
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const { data: niveles } = trpc.grupos.getNiveles.useQuery();
  const { data: grados } = trpc.grupos.getGrados.useQuery();
  const { data: materiasData } = trpc.grupos.getMaterias.useQuery();
  const materias = materiasData as any[] | undefined;
  const { data: todosLosGrupos } = trpc.grupos.getGrupos.useQuery(undefined);
  const { data: todasLasInscripciones, isLoading: isLoadingInscripciones } = trpc.inscripciones.getInscripciones.useQuery(undefined);

  // --- Mutations ---
  const unassignMateriaMutation = trpc.grupos.updateMateria.useMutation({
    onSuccess: () => {
      utils.grupos.getMaterias.invalidate();
    }
  });

  const deleteGrupoMutation = trpc.grupos.deleteGrupo.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      utils.inscripciones.getInscripciones.invalidate();
    }
  });

  // --- Ciclos Activos ---
  const cicloAnualActivo = ciclos?.find(c => c.activo && c.periodicidad === 'ANUAL');
  const cicloSemestralActivo = ciclos?.find(c => c.activo && c.periodicidad === 'SEMESTRAL');

  const cicloAnualActivoId = cicloAnualActivo?.cicloId;
  const cicloSemestralActivoId = cicloSemestralActivo?.cicloId;

  const getCicloIdForNivel = (nivelCodigo: string) => {
    return nivelCodigo === 'BAC' ? cicloSemestralActivoId : cicloAnualActivoId;
  };

  // --- Handlers ---
  const handleSeleccionarGrado = (grado: any, nivel: any) => {
    setCursoSeleccionado({
      gradoId: grado.gradoId,
      numero: grado.numero,
      nombre: grado.nombre,
      nivelId: nivel.nivelId,
      nombreNivel: nivel.nombre,
      nivelCodigo: nivel.codigo
    });
    setFiltroSeccion('Todas');
  };

  const handleDesasignarMateria = (materiaId: number, nombre: string) => {
    if (confirm(`¿Seguro que deseas desasignar la materia "${nombre}" de este grado?`)) {
      unassignMateriaMutation.mutate({
        materiaId,
        gradoId: null
      });
    }
  };

  const handleOpenNewGrupo = () => {
    setEditingGrupo(null);
    setIsGrupoModalOpen(true);
  };

  const handleDeleteGrupo = (grupoId: number, nombre: string) => {
    if (confirm(`¿Seguro que deseas eliminar el grupo/sección "${nombre}"?`)) {
      deleteGrupoMutation.mutate(grupoId);
    }
  };

  // --- Procesamiento de Datos ---
  const getMateriasGrado = (gradoId: number) => {
    return materias?.filter(m => m.gradoId === gradoId) || [];
  };

  const getAlumnosGrado = (gradoId: number, nivelCodigo: string) => {
    const cycleId = getCicloIdForNivel(nivelCodigo);
    return todasLasInscripciones?.filter(i => 
      (i.grupo?.gradoId === gradoId || i.alumno?.gradoId === gradoId) && 
      i.cicloId === cycleId
    ) || [];
  };

  const getGruposGrado = (gradoId: number, nivelCodigo: string) => {
    const cycleId = getCicloIdForNivel(nivelCodigo);
    return todosLosGrupos?.filter(g => g.gradoId === gradoId && g.cicloId === cycleId) || [];
  };

  // Filtrado de alumnos inscritos en el grado actual
  const alumnosDelGrado = cursoSeleccionado ? getAlumnosGrado(cursoSeleccionado.gradoId, cursoSeleccionado.nivelCodigo) : [];
  const gruposDelGrado = cursoSeleccionado ? getGruposGrado(cursoSeleccionado.gradoId, cursoSeleccionado.nivelCodigo) : [];

  // Secciones únicas para el selector de filtro
  const seccionesDisponibles = Array.from(
    new Set(gruposDelGrado.map(g => g.nombre).filter(Boolean))
  );

  const alumnosFiltrados = filtroSeccion === 'Todas'
    ? alumnosDelGrado
    : alumnosDelGrado.filter(i => i.grupo?.nombre === filtroSeccion);

  // Obtener el ID del grupo correspondiente a la sección seleccionada en el filtro
  const grupoSeleccionado = filtroSeccion !== 'Todas' 
    ? gruposDelGrado.find(g => g.nombre === filtroSeccion)
    : null;

  // Renderizar la Vista Detallada de Grado
  if (cursoSeleccionado) {
    const materiasDelGrado = getMateriasGrado(cursoSeleccionado.gradoId);

    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-8 bg-[#F8FAFE] min-h-screen">
        {/* Back and Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCursoSeleccionado(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#001429]">{cursoSeleccionado.nombre}</h1>
              <p className="text-sm text-gray-500 mt-1">{cursoSeleccionado.nombreNivel}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PLAN DE ESTUDIOS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#001429] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> 
                Plan de Estudios ({materiasDelGrado.length})
              </h2>
              <Button 
                onClick={() => setIsAsignarMateriaOpen(true)} 
                icon={<Plus size={16} />}
                className="bg-[#001429] hover:bg-[#002952] text-white text-xs font-semibold px-4 py-2"
              >
                Asignar Materia
              </Button>
            </div>
            
            <div className="p-6">
              {materiasDelGrado.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic">No hay materias asignadas a este grado.</div>
              ) : (
                <div className="space-y-3">
                  {materiasDelGrado.map((mat) => (
                    <div key={mat.materiaId} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#001429]">{mat.nombre}</p>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            mat.tipo === 'curricular' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            mat.tipo === 'taller' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                            'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}>
                            {mat.tipo === 'extracurricular' ? 'Extra' : mat.tipo}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            Docente: {mat.docente?.nombreCompleto || 'Sin asignar'}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDesasignarMateria(mat.materiaId, mat.nombre)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg p-1.5"
                        title="Desasignar materia de este grado"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ALUMNOS DEL GRADO */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-wrap gap-4">
              <h2 className="text-lg font-bold text-[#001429] flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> 
                Alumnos Inscritos ({alumnosFiltrados.length})
              </h2>
              <div className="flex items-center gap-2">
                <select 
                  value={filtroSeccion} 
                  onChange={e => setFiltroSeccion(e.target.value)} 
                  className="text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none text-[#001429] font-medium bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                >
                  <option value="Todas">Todos los Grupos</option>
                  {seccionesDisponibles.map(sec => (
                    <option key={sec} value={sec}>Grupo {sec}</option>
                  ))}
                </select>
                
                {grupoSeleccionado && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteGrupo(grupoSeleccionado.grupoId, grupoSeleccionado.nombre)}
                    title="Eliminar grupo/sección"
                    className="text-red-600 hover:bg-red-50 p-2 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}

                <Button 
                  onClick={handleOpenNewGrupo} 
                  icon={<Plus size={14} />}
                  className="bg-[#001429] hover:bg-[#002952] text-white text-xs font-semibold px-3 py-2"
                >
                  Agregar Grupo
                </Button>
              </div>
            </div>

            <div className="p-6">
              {isLoadingInscripciones ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : alumnosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic">No hay alumnos inscritos en este filtro.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-medium text-xs uppercase">
                        <th className="pb-3 text-left font-semibold">Matrícula</th>
                        <th className="pb-3 text-left font-semibold">Nombre del Alumno</th>
                        <th className="pb-3 text-right font-semibold">Grupo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alumnosFiltrados.map((i) => (
                        <tr 
                          key={i.inscripcionId} 
                          className="hover:bg-gray-50 transition-colors cursor-pointer" 
                          onClick={() => navigate(`/alumnos/${i.alumnoId}`)}
                        >
                          <td className="py-3.5 text-xs text-gray-500 font-semibold">{i.alumno.matricula || '-'}</td>
                          <td className="py-3.5 text-sm font-semibold text-[#001429]">{i.alumno.nombreCompleto}</td>
                          <td className="py-3.5 text-right">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                              {i.grupo?.nombre || 'Sin Grupo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modales del detalle */}
        <AsignarMateriaModal
          isOpen={isAsignarMateriaOpen}
          onClose={() => setIsAsignarMateriaOpen(false)}
          gradoId={cursoSeleccionado.gradoId}
        />

        <GrupoFormModal 
          isOpen={isGrupoModalOpen}
          onClose={() => setIsGrupoModalOpen(false)}
          grupoId={editingGrupo?.grupoId}
          initialData={editingGrupo}
          defaultCicloId={getCicloIdForNivel(cursoSeleccionado.nivelCodigo)}
          defaultNivelId={cursoSeleccionado.nivelId}
          defaultGradoId={cursoSeleccionado.gradoId}
        />
      </div>
    );
  }

  // Renderizar la Vista Principal (Listado de Niveles y Grados)
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-8 bg-[#F8FAFE] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#001429] flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#001429]" />
            Grados Académicos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los planes de estudio y alumnos inscritos por nivel educativo.</p>
        </div>

        {/* Listado de Ciclos Activos */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {cicloAnualActivo && (
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 text-xs font-semibold">
              <Calendar size={14} /> Anual Activo: {cicloAnualActivo.nombre}
            </span>
          )}
          {cicloSemestralActivo && (
            <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl border border-purple-100 text-xs font-semibold">
              <Calendar size={14} /> Semestral Activo: {cicloSemestralActivo.nombre}
            </span>
          )}
        </div>
      </div>

      {/* Listado de Niveles y Grados fijos */}
      <div className="space-y-8">
        {niveles?.map((nivel) => {
          // Filtrar grados correspondientes a este nivel
          const gradosDelNivel = grados?.filter(g => g.nivelId === nivel.nivelId) || [];

          return (
            <div key={nivel.nivelId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#001429] p-4 px-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">{nivel.nombre}</h2>
              </div>
              <div className="p-6">
                {gradosDelNivel.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">No hay grados registrados en este nivel.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gradosDelNivel.map((grado) => {
                      const materiasGradoCount = getMateriasGrado(grado.gradoId).length;
                      const alumnosGradoCount = getAlumnosGrado(grado.gradoId, nivel.codigo).length;
                      const gruposGradoCount = getGruposGrado(grado.gradoId, nivel.codigo).length;

                      return (
                        <div 
                          key={grado.gradoId} 
                          onClick={() => handleSeleccionarGrado(grado, nivel)}
                          className="group p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                        >
                          <h3 className="text-lg font-bold text-[#001429] mb-4 group-hover:text-blue-600 transition-colors">
                            {grado.nombre}
                          </h3>
                          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mt-2">
                            <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                              <BookOpen className="w-3.5 h-3.5 text-gray-400" /> {materiasGradoCount} Materias
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                              <Users className="w-3.5 h-3.5 text-gray-400" /> {alumnosGradoCount} Alumnos
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                              <LayoutGrid className="w-3.5 h-3.5 text-gray-400" /> Grupos: {gruposGradoCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
