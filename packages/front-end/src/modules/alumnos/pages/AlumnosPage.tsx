import { Plus, Search, Download, Trash2, Edit2 } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { NuevoAlumnoModal } from '../../alumnos/components/NuevoAlumnoModal';
import { NuevoTutorModal } from '../../alumnos/components/NuevoTutorModal';
import { VincularTutorModal } from '../../alumnos/components/VincularTutorModal';
import { EditarAlumnoModal } from '../../alumnos/components/EditarAlumnoModal';

// Helpers to rank levels for sorting
const nivelRanking: Record<string, number> = {
  'PREESCOLAR': 1,
  'PRIMARIA': 2,
  'SECUNDARIA': 3,
  'BACHILLERATO': 4,
};

export function AlumnosPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: alumnos, isLoading, refetch } = trpc.alumnos.getAll.useQuery();
  const updateAlumnoMutation = trpc.alumnos.update.useMutation();
  const deleteAlumnoMutation = trpc.alumnos.delete.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alumnoParaTutor, setAlumnoParaTutor] = useState<number | null>(null);
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);
  const [isNuevoTutorModalOpen, setIsNuevoTutorModalOpen] = useState(false);
  const [isEnFlujoNuevoAlumno, setIsEnFlujoNuevoAlumno] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<any>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('ACTIVO');
  const [nivelFilter, setNivelFilter] = useState('Todos los niveles');
  const [gradoFilter, setGradoFilter] = useState('Todos los grados');
  const [grupoFilter, setGrupoFilter] = useState('Todos los grupos');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedData = useMemo(() => {
    if (!alumnos) return [];

    // 1. Filter
    const filtered = alumnos.filter((a: any) => {
      // Search
      const fullName = (a.nombreCompleto || '').toLowerCase();
      const matricula = a.matricula?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      const matchesSearch = fullName.includes(term) || matricula.includes(term);

      // Estado
      const matchesEstado = estadoFilter === 'Todos' ? true : a.estado === estadoFilter;

      // Nivel, Grado, Grupo
      const inscripcionActual = a.inscripciones?.[0];
      const nivel = a.nivel?.nombre || '';
      const grado = inscripcionActual?.grupo?.grado?.nombre || '';
      const grupo = inscripcionActual?.grupo?.nombre || '';

      const matchesNivel = nivelFilter === 'Todos los niveles' ? true : nivel === nivelFilter;
      const matchesGrado = gradoFilter === 'Todos los grados' ? true : grado === gradoFilter;
      const matchesGrupo = grupoFilter === 'Todos los grupos' ? true : grupo === grupoFilter;

      return matchesSearch && matchesEstado && matchesNivel && matchesGrado && matchesGrupo;
    });

    // 2. Sort by Nivel -> Grado -> Grupo -> Nombre
    return filtered.sort((a, b) => {
      const inscA = a.inscripciones?.[0];
      const inscB = b.inscripciones?.[0];

      const nivelA = a.nivel?.nombre || '';
      const nivelB = b.nivel?.nombre || '';
      const rankA = nivelRanking[nivelA] || 99;
      const rankB = nivelRanking[nivelB] || 99;

      if (rankA !== rankB) return rankA - rankB;

      const gradoA = inscA?.grupo?.grado?.nombre || '';
      const gradoB = inscB?.grupo?.grado?.nombre || '';
      if (gradoA !== gradoB) return gradoA.localeCompare(gradoB);

      const grupoA = inscA?.grupo?.nombre || '';
      const grupoB = inscB?.grupo?.nombre || '';
      if (grupoA !== grupoB) return grupoA.localeCompare(grupoB);

      return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '');
    });
  }, [alumnos, searchTerm, estadoFilter, nivelFilter, gradoFilter, grupoFilter]);

  // Derived filter options based on available data
  const availableNiveles = useMemo(() => {
    const niveles = Array.from(new Set((alumnos as any[])?.map(a => a.nivel?.nombre).filter(Boolean)));
    return niveles.sort((a, b) => (nivelRanking[a as string] || 99) - (nivelRanking[b as string] || 99));
  }, [alumnos]);
  
  const availableGrados = useMemo(() => {
    let filtered = alumnos as any[] || [];
    if (nivelFilter !== 'Todos los niveles') {
      filtered = filtered.filter(a => a.nivel?.nombre === nivelFilter);
    }
    const grados = Array.from(new Set(filtered.map(a => a.inscripciones?.[0]?.grupo?.grado?.nombre).filter(Boolean)));
    return grados.sort((a, b) => {
      const numA = parseInt((a as string).replace(/\D/g, '')) || 99;
      const numB = parseInt((b as string).replace(/\D/g, '')) || 99;
      return numA - numB;
    });
  }, [alumnos, nivelFilter]);

  const availableGrupos = useMemo(() => {
    let filtered = alumnos as any[] || [];
    if (nivelFilter !== 'Todos los niveles') {
      filtered = filtered.filter(a => a.nivel?.nombre === nivelFilter);
    }
    if (gradoFilter !== 'Todos los grados') {
      filtered = filtered.filter(a => a.inscripciones?.[0]?.grupo?.grado?.nombre === gradoFilter);
    }
    return Array.from(new Set(filtered.map(a => a.inscripciones?.[0]?.grupo?.nombre).filter(Boolean)));
  }, [alumnos, nivelFilter, gradoFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const currentData = filteredAndSortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    // Basic export functionality
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Matricula,Nombre,Nivel,Grado,Grupo,Estado\n"
      + (filteredAndSortedData as any[]).map((a: any) => {
        const insc = a.inscripciones?.[0];
        return `${a.matricula || ''},${a.nombreCompleto || ''},${a.nivel?.nombre || ''},${insc?.grupo?.grado?.nombre || ''},${insc?.grupo?.nombre || ''},${a.estado}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "alumnos_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFiltersCount = [
    searchTerm !== '',
    estadoFilter !== 'Todos',
    nivelFilter !== 'Todos los niveles',
    gradoFilter !== 'Todos los grados',
    grupoFilter !== 'Todos los grupos'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setEstadoFilter('Todos');
    setNivelFilter('Todos los niveles');
    setGradoFilter('Todos los grados');
    setGrupoFilter('Todos los grupos');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4 md:p-8 bg-[#F8FAFE] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#001429]">Directorio Escolar</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#001429] text-white font-semibold rounded-xl hover:bg-[#002952] transition-colors shadow-lg shadow-blue-900/20 cursor-pointer"
        >
          <Plus size={18} /> Nuevo alumno
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:flex-wrap gap-4 items-end">
        {/* Buscador */}
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar alumno</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o matrícula..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 pl-10 pr-3 py-2 sm:text-sm outline-none transition-colors"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="w-full sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 px-3 py-2 sm:text-sm outline-none transition-colors bg-white cursor-pointer"
          >
            <option value="Todos">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="BAJA_TEMPORAL">Baja Temporal</option>
            <option value="BAJA_DEFINITIVA">Baja Definitiva</option>
            <option value="TRANSICION_PENDIENTE">Transición Pendiente</option>
          </select>
        </div>

        {/* Nivel */}
        <div className="w-full sm:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
          <select
            value={nivelFilter}
            onChange={e => {
              setNivelFilter(e.target.value);
              setGradoFilter('Todos los grados');
              setGrupoFilter('Todos los grupos');
            }}
            className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 px-3 py-2 sm:text-sm outline-none transition-colors bg-white cursor-pointer"
          >
            <option value="Todos los niveles">Todos</option>
            {availableNiveles.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Grado */}
        {nivelFilter !== 'Todos los niveles' && (
          <div className="w-full sm:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
            <select
              value={gradoFilter}
              onChange={e => {
                setGradoFilter(e.target.value);
                setGrupoFilter('Todos los grupos');
              }}
              className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 px-3 py-2 sm:text-sm outline-none transition-colors bg-white cursor-pointer"
            >
              <option value="Todos los grados">Todos</option>
              {availableGrados.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        {/* Grupo */}
        {gradoFilter !== 'Todos los grados' && (
          <div className="w-full sm:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
            <select
              value={grupoFilter}
              onChange={e => setGrupoFilter(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 px-3 py-2 sm:text-sm outline-none transition-colors bg-white cursor-pointer"
            >
              <option value="Todos los grupos">Todos</option>
              {availableGrupos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        {/* Quitar Filtros */}
        {activeFiltersCount > 1 && (
          <div className="w-full sm:w-auto pb-0.5">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors text-sm border border-red-100"
            >
              Quitar filtros
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 font-medium px-1">
        <span>Total de registros: {filteredAndSortedData.length}</span>
        <button onClick={handleExport} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <Download size={16} /> Exportar
        </button>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[600px]">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Cargando alumnos...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 font-medium border-b border-gray-100 bg-white">
                <tr>
                  <th className="px-6 py-4 font-semibold">Alumno</th>
                  <th className="px-6 py-4 font-semibold">Grupo/Nivel</th>
                  <th className="px-6 py-4 font-semibold">Tutor</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.map((a: any) => {
                  const inscripcion = a.inscripciones?.[0];
                  
                  const gradoNombre = inscripcion?.grupo?.grado?.nombre || a.grado?.nombre || '';
                  const grupoNombre = inscripcion?.grupo?.nombre || '';
                  const nivelNombre = a.nivel?.nombre || '';
                  
                  let grupoNivel = 'Sin asignar';
                  if (gradoNombre || grupoNombre || nivelNombre) {
                    const partes = [];
                    if (gradoNombre) partes.push(gradoNombre);
                    
                    const grupoNivelText = `${grupoNombre} ${nivelNombre}`.trim();
                    if (grupoNivelText) partes.push(grupoNivelText);
                    
                    grupoNivel = partes.join(' - ');
                  }
                  const tutorPrincipal = a.tutoresAlumnos?.[0]?.tutor;

                  return (
                    <tr key={a.alumnoId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{a.nombreCompleto}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Matrícula: {a.matricula || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{grupoNivel}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {tutorPrincipal ? `${tutorPrincipal.nombreCompleto}` : 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        <div>Tel: {tutorPrincipal?.telefono || '-'}</div>
                        {tutorPrincipal?.correoElectronico && (
                          <div className="mt-0.5">{tutorPrincipal.correoElectronico}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/alumnos/${a.alumnoId}`)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            Ver expediente
                          </button>
                          <button
                            onClick={() => setEditingAlumno(a)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Editar alumno"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('¿Estás seguro de que deseas dar de baja temporal a este alumno?')) {
                                try {
                                  await updateAlumnoMutation.mutateAsync({ alumnoId: a.alumnoId, estado: 'BAJA_TEMPORAL' } as any);
                                  utils.alumnos.getAll.invalidate();
                                } catch (error: any) {
                                  alert(error.message || 'Error al actualizar alumno');
                                }
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Dar de baja temporal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {currentData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No se encontraron alumnos con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto">
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages} • {filteredAndSortedData.length} resultados
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <NuevoAlumnoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(alumnoId) => {
          setIsModalOpen(false);
          refetch();
          setAlumnoParaTutor(alumnoId);
          setIsEnFlujoNuevoAlumno(true);
          setIsVincularModalOpen(true);
        }}
      />

      {isVincularModalOpen && alumnoParaTutor && (
        <VincularTutorModal
          isOpen={isVincularModalOpen}
          alumnoId={alumnoParaTutor}
          onClose={() => {
            if (isEnFlujoNuevoAlumno) {
              if (window.confirm('El alumno no puede registrarse sin un tutor. Si cancelas, el registro del alumno será eliminado. ¿Deseas cancelar?')) {
                deleteAlumnoMutation.mutate(alumnoParaTutor);
                setIsVincularModalOpen(false);
                setAlumnoParaTutor(null);
                setIsEnFlujoNuevoAlumno(false);
                refetch();
              }
            } else {
              setIsVincularModalOpen(false);
              setAlumnoParaTutor(null);
            }
          }}
          onSuccess={() => {
            setIsVincularModalOpen(false);
            setAlumnoParaTutor(null);
            setIsEnFlujoNuevoAlumno(false);
            refetch();
          }}
          onRegistrarPadre={() => {
            setIsVincularModalOpen(false);
            setIsNuevoTutorModalOpen(true);
          }}
        />
      )}

      {isNuevoTutorModalOpen && alumnoParaTutor && (
        <NuevoTutorModal
          isOpen={isNuevoTutorModalOpen}
          alumnoId={alumnoParaTutor}
          onClose={() => {
            setIsNuevoTutorModalOpen(false);
            // Regresamos al modal de vincular para que siga en el flujo
            setIsVincularModalOpen(true);
          }}
          onSuccess={() => {
            setIsNuevoTutorModalOpen(false);
            setAlumnoParaTutor(null);
            setIsEnFlujoNuevoAlumno(false);
            refetch();
          }}
        />
      )}

      <EditarAlumnoModal
        isOpen={!!editingAlumno}
        onClose={() => setEditingAlumno(null)}
        alumno={editingAlumno}
      />
    </div>
  );
}
