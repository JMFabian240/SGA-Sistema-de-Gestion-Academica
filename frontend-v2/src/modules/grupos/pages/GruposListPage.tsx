import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, BookOpen } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { GrupoFormModal } from '../components/GrupoFormModal';
import { InicializarGruposModal } from '../components/InicializarGruposModal';
import { MateriaFormModal } from '../components/MateriaFormModal';

export function GruposListPage() {
  const [activeTab, setActiveTab] = useState<'grupos' | 'materias'>('grupos');
  const utils = trpc.useUtils();

  // --- Estados de Grupos ---
  const [selectedCicloId, setSelectedCicloId] = useState<number | undefined>(undefined);
  const [grupoSearch, setGrupoSearch] = useState('');
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<any>(null);
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);

  // --- Estados de Materias ---
  const [materiaSearch, setMateriaSearch] = useState('');
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<any>(null);

  // --- Queries ---
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const { data: grupos, isLoading: isGruposLoading } = trpc.grupos.getGrupos.useQuery(
    selectedCicloId ? { cicloId: selectedCicloId } : {},
    { enabled: activeTab === 'grupos' }
  );
  const { data: materias, isLoading: isMateriasLoading } = trpc.grupos.getMaterias.useQuery(
    undefined,
    { enabled: activeTab === 'materias' }
  );

  // --- Mutations ---
  const deleteGrupoMutation = trpc.grupos.deleteGrupo.useMutation({
    onSuccess: () => utils.grupos.getGrupos.invalidate()
  });
  const deleteMateriaMutation = trpc.grupos.deleteMateria.useMutation({
    onSuccess: () => utils.grupos.getMaterias.invalidate()
  });

  // Seleccionar ciclo activo por defecto
  useEffect(() => {
    if (ciclos && !selectedCicloId) {
      const active = ciclos.find(c => c.activo);
      if (active) {
        setSelectedCicloId(active.cicloId);
      } else if (ciclos.length > 0) {
        setSelectedCicloId(ciclos[0].cicloId);
      }
    }
  }, [ciclos, selectedCicloId]);

  // --- Handlers de Grupos ---
  const handleOpenNewGrupo = () => {
    setEditingGrupo(null);
    setIsGrupoModalOpen(true);
  };

  const handleOpenEditGrupo = (grupo: any) => {
    setEditingGrupo(grupo);
    setIsGrupoModalOpen(true);
  };

  const handleDeleteGrupo = (grupoId: number, nombre: string) => {
    if (confirm(`¿Seguro que deseas eliminar el grupo "${nombre}"? Se desvincularán alumnos e inscripciones.`)) {
      deleteGrupoMutation.mutate(grupoId);
    }
  };

  // --- Handlers de Materias ---
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

  // --- Filtros ---
  const filteredGrupos = grupos?.filter(g => 
    g.nombre.toLowerCase().includes(grupoSearch.toLowerCase())
  );

  const filteredMaterias = materias?.filter(m => 
    m.nombre.toLowerCase().includes(materiaSearch.toLowerCase()) ||
    m.clave.toLowerCase().includes(materiaSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grupos y Materias</h2>
          <p className="text-gray-500">Gestión de la estructura curricular de la institución</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('grupos')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'grupos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Grupos
          </button>
          <button
            onClick={() => setActiveTab('materias')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'materias'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Materias
          </button>
        </nav>
      </div>

      {/* --- PESTAÑA DE GRUPOS --- */}
      {activeTab === 'grupos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Ciclo Selector */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                <Calendar size={16} className="text-gray-400" />
                <select
                  value={selectedCicloId ?? ''}
                  onChange={(e) => setSelectedCicloId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none pr-6 cursor-pointer"
                >
                  {ciclos?.map(c => (
                    <option key={c.cicloId} value={c.cicloId}>
                      {c.nombre} {c.activo ? '(Activo)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative w-64 bg-white rounded-xl shadow-sm border border-gray-200">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar grupo..."
                  value={grupoSearch}
                  onChange={(e) => setGrupoSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsInitModalOpen(true)}
                disabled={!selectedCicloId}
                icon={<BookOpen size={16} />}
              >
                Inicializar Ciclo
              </Button>
              <Button 
                onClick={handleOpenNewGrupo}
                icon={<Plus size={16} />}
              >
                Nuevo Grupo
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              {isGruposLoading ? (
                <div className="p-8 text-center text-gray-400">Cargando grupos...</div>
              ) : !filteredGrupos || filteredGrupos.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No se encontraron grupos para este ciclo.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Nombre del Grupo</th>
                      <th className="px-6 py-4">Nivel Educativo</th>
                      <th className="px-6 py-4">Grado</th>
                      <th className="px-6 py-4">Cupo Máximo</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredGrupos.map((g) => (
                      <tr key={g.grupoId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{g.nombre}</td>
                        <td className="px-6 py-4 text-gray-500">{g.nivel?.nombre}</td>
                        <td className="px-6 py-4 text-gray-500">{g.grado?.nombre || `${g.grado?.numero}º Grado`}</td>
                        <td className="px-6 py-4 text-gray-500">{g.cupoMaximo} alumnos</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            g.cerrado ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                          }`}>
                            {g.cerrado ? 'Cerrado' : 'Activo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenEditGrupo(g)}
                              disabled={!!g.cerrado}
                              title={g.cerrado ? 'No se puede editar un grupo cerrado' : 'Editar Grupo'}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteGrupo(g.grupoId, g.nombre)}
                              disabled={!!g.cerrado}
                              title={g.cerrado ? 'No se puede eliminar un grupo cerrado' : 'Eliminar Grupo'}
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
      )}

      {/* --- PESTAÑA DE MATERIAS --- */}
      {activeTab === 'materias' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            {/* Search Bar */}
            <div className="relative w-64 bg-white rounded-xl shadow-sm border border-gray-200">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por clave o nombre..."
                value={materiaSearch}
                onChange={(e) => setMateriaSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl outline-none text-sm bg-transparent"
              />
            </div>

            <Button 
              onClick={handleOpenNewMateria}
              icon={<Plus size={16} />}
            >
              Nueva Materia
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              {isMateriasLoading ? (
                <div className="p-8 text-center text-gray-400">Cargando materias...</div>
              ) : !filteredMaterias || filteredMaterias.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No se encontraron materias en el catálogo.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Clave</th>
                      <th className="px-6 py-4">Nombre de la Materia</th>
                      <th className="px-6 py-4">Grado Asignado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMaterias.map((m) => (
                      <tr key={m.materiaId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700 bg-gray-50/40 w-32">{m.clave}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{m.nombre}</td>
                        <td className="px-6 py-4 text-gray-500">{m.grado?.nombre || 'General / Ninguno'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenEditMateria(m)}
                              title="Editar Materia"
                            >
                              <Edit2 size={14} />
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
      )}

      {/* --- MODALES --- */}
      {selectedCicloId && (
        <InicializarGruposModal 
          isOpen={isInitModalOpen}
          onClose={() => setIsInitModalOpen(false)}
          cicloId={selectedCicloId}
        />
      )}

      <GrupoFormModal 
        isOpen={isGrupoModalOpen}
        onClose={() => setIsGrupoModalOpen(false)}
        grupoId={editingGrupo?.grupoId}
        initialData={editingGrupo}
      />

      <MateriaFormModal 
        isOpen={isMateriaModalOpen}
        onClose={() => setIsMateriaModalOpen(false)}
        materiaId={editingMateria?.materiaId}
        initialData={editingMateria}
      />
    </div>
  );
}
