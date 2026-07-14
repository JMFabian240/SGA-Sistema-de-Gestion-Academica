import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { MateriaFormModal } from '../components/MateriaFormModal';

export function MateriaFormModalWrapper({ isOpen, onClose, materiaId, initialData }: { isOpen: boolean; onClose: () => void; materiaId?: number; initialData?: any }) {
  return (
    <MateriaFormModal
      isOpen={isOpen}
      onClose={onClose}
      materiaId={materiaId}
      initialData={initialData}
    />
  );
}

export function MateriasListPage() {
  const utils = trpc.useUtils();
  const [materiaSearch, setMateriaSearch] = useState('');
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<any>(null);

  // --- Filtros ---
  const [selectedNivelId, setSelectedNivelId] = useState<string>('Todos');
  const [selectedGradoId, setSelectedGradoId] = useState<string>('Todos');
  const [selectedGrupoNombre, setSelectedGrupoNombre] = useState<string>('Todos');

  // --- Queries ---
  const { data: materiasData, isLoading: isMateriasLoading } = trpc.grupos.getMaterias.useQuery();
  const materias = materiasData as any[] | undefined;

  const { data: niveles } = trpc.grupos.getNiveles.useQuery();
  const { data: grados } = trpc.grupos.getGrados.useQuery();
  const { data: grupos } = trpc.grupos.getGrupos.useQuery(undefined);
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();

  // --- Mutations ---
  const deleteMateriaMutation = trpc.grupos.deleteMateria.useMutation({
    onSuccess: () => utils.grupos.getMaterias.invalidate()
  });

  // --- Handlers ---
  const handleOpenNewMateria = () => {
    setEditingMateria(null);
    setIsMateriaModalOpen(true);
  };

  const handleOpenEditMateria = (materia: any) => {
    setEditingMateria(materia);
    setIsMateriaModalOpen(true);
  };

  const handleDeleteMateria = (materiaId: number, nombre: string) => {
    if (confirm(`¿Seguro que deseas eliminar la materia "${nombre}"?`)) {
      deleteMateriaMutation.mutate(materiaId);
    }
  };

  const isAnyFilterActive = 
    materiaSearch !== '' ||
    selectedNivelId !== 'Todos' ||
    selectedGradoId !== 'Todos' ||
    selectedGrupoNombre !== 'Todos';

  const handleClearFilters = () => {
    setMateriaSearch('');
    setSelectedNivelId('Todos');
    setSelectedGradoId('Todos');
    setSelectedGrupoNombre('Todos');
  };

  // --- Procesamiento de Filtros ---
  const cicloAnualActivo = ciclos?.find(c => c.activo && c.periodicidad === 'ANUAL');
  const cicloSemestralActivo = ciclos?.find(c => c.activo && c.periodicidad === 'SEMESTRAL');
  const activeCycleIds = [cicloAnualActivo?.cicloId, cicloSemestralActivo?.cicloId].filter(Boolean);

  // Filtrar grupos para mostrar sólo los pertenecientes a ciclos activos
  const activeGrupos = grupos?.filter(g => activeCycleIds.includes(g.cicloId)) || [];

  // Obtener los grupos asignados a una materia (ya sea de forma explícita o heredada del grado/ciclo activo)
  const getGruposAsignados = (m: any) => {
    if (m.gruposMaterias && m.gruposMaterias.length > 0) {
      return m.gruposMaterias.map((gm: any) => gm.grupo).filter(Boolean);
    }
    if (!m.gradoId) return [];
    const cycleId = m.grado?.nivel?.codigo === 'BAC' ? cicloSemestralActivo?.cicloId : cicloAnualActivo?.cicloId;
    if (!cycleId) return [];
    return activeGrupos.filter(g => g.gradoId === m.gradoId && g.cicloId === cycleId);
  };

  // Obtener letras (nombres) de grupo únicas para el grado seleccionado (ej. "A", "B")
  const filteredGrupoLetters = (() => {
    if (selectedGradoId === 'Todos') return [];
    const gradoIdNum = parseInt(selectedGradoId, 10);
    const gruposDelGrado = activeGrupos.filter(g => g.gradoId === gradoIdNum);
    const letras = gruposDelGrado.map(g => g.nombre ? g.nombre.trim().split(/\s+/).pop() : '').filter(Boolean);
    return Array.from(new Set(letras));
  })();

  // Opciones de grado filtradas por el nivel seleccionado
  const filteredGradosOptions = grados?.filter(g => 
    selectedNivelId === 'Todos' || g.nivelId === parseInt(selectedNivelId, 10)
  ) || [];

  const filteredMaterias = materias?.filter(m => {
    // 1. Filtro del Buscador (clave, nombre o docente)
    const searchLower = materiaSearch.toLowerCase();
    const matchesSearch = !materiaSearch ||
      m.nombre.toLowerCase().includes(searchLower) ||
      m.clave.toLowerCase().includes(searchLower) ||
      (m.docente?.nombreCompleto && m.docente.nombreCompleto.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // 2. Filtro por Nivel
    if (selectedNivelId !== 'Todos') {
      const nivelIdNum = parseInt(selectedNivelId, 10);
      if (m.grado?.nivelId !== nivelIdNum) return false;
    }

    // 3. Filtro por Grado
    if (selectedGradoId !== 'Todos') {
      const gradoIdNum = parseInt(selectedGradoId, 10);
      if (m.gradoId !== gradoIdNum) return false;

      // 4. Filtro por Grupo (solo si hay grado activo)
      if (selectedGrupoNombre !== 'Todos') {
        const assignedToGrupo = getGruposAsignados(m).some((g: any) => {
          const letra = g.nombre ? g.nombre.trim().split(/\s+/).pop() : '';
          return letra === selectedGrupoNombre;
        });
        if (!assignedToGrupo) return false;
      }
    }

    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-8 bg-[#F8FAFE] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#001429] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#001429]" />
            Materias
          </h2>
          <p className="text-gray-500 text-sm mt-1">Catálogo general de asignaturas de la institución</p>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          {/* Contenedor del buscador y selects */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center flex-1 w-full">
            {/* Buscador */}
            <div className="relative w-full sm:w-64 bg-white rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por clave, nombre o docente..."
                value={materiaSearch}
                onChange={(e) => setMateriaSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl outline-none text-sm bg-transparent"
              />
            </div>

            {/* Select Nivel */}
            <select
              value={selectedNivelId}
              onChange={(e) => {
                setSelectedNivelId(e.target.value);
                setSelectedGradoId('Todos');
              }}
              className="w-full sm:w-auto text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none text-[#001429] font-medium bg-white focus:border-blue-500 transition-colors"
            >
              <option value="Todos">Todos los Niveles</option>
              {niveles?.map(n => (
                <option key={n.nivelId} value={n.nivelId}>{n.nombre}</option>
              ))}
            </select>

            {/* Select Grado */}
            <select
              disabled={selectedNivelId === 'Todos'}
              value={selectedGradoId}
              onChange={(e) => {
                setSelectedGradoId(e.target.value);
                setSelectedGrupoNombre('Todos');
              }}
              className="w-full sm:w-auto text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none text-[#001429] font-medium bg-white focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 transition-colors"
            >
              <option value="Todos">Todos los Grados</option>
              {filteredGradosOptions.map(g => (
                <option key={g.gradoId} value={g.gradoId}>{g.nombre}</option>
              ))}
            </select>

            {/* Select Grupo */}
            <select
              disabled={selectedGradoId === 'Todos'}
              value={selectedGrupoNombre}
              onChange={(e) => setSelectedGrupoNombre(e.target.value)}
              className="w-full sm:w-auto text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none text-[#001429] font-medium bg-white focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 transition-colors"
            >
              <option value="Todos">Todos los Grupos</option>
              {filteredGrupoLetters.map(letra => (
                <option key={letra} value={letra}>Grupo {letra}</option>
              ))}
            </select>

            {/* Borrar Filtros */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-2 cursor-pointer hover:bg-red-50 rounded-xl transition-colors"
              >
                Borrar Filtros
              </button>
            )}
          </div>

          <Button 
            onClick={handleOpenNewMateria}
            icon={<Plus size={16} />}
            className="bg-[#001429] hover:bg-[#002952] text-white self-stretch sm:self-auto shrink-0"
          >
            Nueva Materia
          </Button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            {isMateriasLoading ? (
              <div className="p-8 text-center text-gray-400">Cargando materias...</div>
            ) : filteredMaterias.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No se encontraron materias en el catálogo con los filtros aplicados.</div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Nombre de la Materia</th>
                    <th className="px-6 py-4">Clave</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Nivel Educativo</th>
                    <th className="px-6 py-4">Grado Asignado</th>
                    <th className="px-6 py-4">Grupos</th>
                    <th className="px-6 py-4">Docente Titular</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredMaterias.map((m) => (
                    <tr key={m.materiaId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#001429]">{m.nombre}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{m.clave}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          m.tipo === 'curricular' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          m.tipo === 'taller' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                          'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                          {m.tipo === 'extracurricular' ? 'Extra' : m.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {m.grado?.nivel?.nombre || 'General / Ninguno'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{m.grado?.nombre || 'General / Ninguno'}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {(() => {
                          const gruposAsignados = getGruposAsignados(m);
                          if (gruposAsignados.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1">
                                {gruposAsignados.map((g: any) => {
                                  const letra = g.nombre ? g.nombre.trim().split(/\s+/).pop() : '';
                                  return (
                                    <span key={g.grupoId} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                                      {letra}
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          }
                          return <span className="text-gray-400 italic text-xs">Ninguno</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{m.docente?.nombreCompleto || 'Sin Asignar'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenEditMateria(m)}
                            title="Editar Materia"
                            className="hover:bg-gray-100"
                          >
                            <Edit2 size={14} className="text-gray-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteMateria(m.materiaId, m.nombre)}
                            title="Eliminar Materia"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <MateriaFormModal
        isOpen={isMateriaModalOpen}
        onClose={() => setIsMateriaModalOpen(false)}
        materiaId={editingMateria?.materiaId}
        initialData={editingMateria}
      />
    </div>
  );
}
