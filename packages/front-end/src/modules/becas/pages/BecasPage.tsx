import { useState } from 'react';
import { Award, Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import toast from 'react-hot-toast';
import { BecaFormModal } from '../components/BecaFormModal';
import { BuscadorAsignarBecaModal } from '../components/BuscadorAsignarBecaModal';
import { EditarAsignacionModal } from '../components/EditarAsignacionModal';

type TabType = 'ASIGNADAS' | 'CATALOGO';

export function BecasPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ASIGNADAS');
  
  // States for Catalog Modal
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [isCatalogoModalOpen, setIsCatalogoModalOpen] = useState(false);
  const [editingBeca, setEditingBeca] = useState<any>(null);

  // States for Assignment Modals
  const [busquedaAlumnos, setBusquedaAlumnos] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState<any>(null);

  // Queries
  const { data: becas, isLoading: loadingBecas, refetch: refetchBecas } = trpc.becas.getBecas.useQuery();
  const { data: asignaciones, isLoading: loadingAsignaciones, refetch: refetchAsignaciones } = trpc.becas.getAsignaciones.useQuery();

  // Mutations (Catalogo)
  const createMutation = trpc.becas.createBeca.useMutation({
    onSuccess: () => {
      toast.success('Beca creada exitosamente');
      setIsCatalogoModalOpen(false);
      refetchBecas();
    },
    onError: (err) => toast.error(err.message)
  });

  const updateMutation = trpc.becas.updateBeca.useMutation({
    onSuccess: () => {
      toast.success('Beca actualizada exitosamente');
      setIsCatalogoModalOpen(false);
      refetchBecas();
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = trpc.becas.deleteBeca.useMutation({
    onSuccess: () => {
      toast.success('Beca eliminada exitosamente');
      refetchBecas();
    },
    onError: (err) => toast.error(err.message)
  });

  // Mutations (Asignaciones)
  const revokeBecaMutation = trpc.becas.revokeBeca.useMutation({
    onSuccess: () => {
      toast.success('Beca revocada exitosamente');
      refetchAsignaciones();
    },
    onError: (err) => toast.error(err.message)
  });

  // Handlers (Catalogo)
  const handleOpenNewBeca = () => {
    setEditingBeca(null);
    setIsCatalogoModalOpen(true);
  };

  const handleOpenEditBeca = (beca: any) => {
    setEditingBeca({
      becaId: beca.becaId,
      nombreBeca: beca.nombreBeca,
      criterio: beca.criterio,
      porcentaje: Number(beca.porcentaje),
      descripcion: beca.descripcion || ''
    });
    setIsCatalogoModalOpen(true);
  };

  const handleDeleteBeca = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta beca? Ya no podrá ser asignada a más alumnos.')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmitBeca = (data: any) => {
    if (editingBeca) {
      updateMutation.mutate({ ...data, becaId: editingBeca.becaId });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handlers (Asignaciones)
  const handleRevokeAsignacion = (asignacionId: number) => {
    if (confirm('¿Estás seguro de que deseas revocar esta beca al alumno? Se aplicarán cargos regulares en adelante si no tiene otra beca.')) {
      revokeBecaMutation.mutate({ asignacionId, motivoRetiro: 'Retiro manual desde panel de becas' });
    }
  };

  // Filters
  const becasFiltradas = becas?.filter((b) => 
    b.nombreBeca.toLowerCase().includes(busquedaCatalogo.toLowerCase()) || 
    b.criterio.toLowerCase().includes(busquedaCatalogo.toLowerCase())
  ) || [];

  const asignacionesFiltradas = (asignaciones as any[])?.filter((a: any) =>
    a.alumno.nombreCompleto.toLowerCase().includes(busquedaAlumnos.toLowerCase()) ||
    a.beca.nombreBeca.toLowerCase().includes(busquedaAlumnos.toLowerCase()) ||
    a.alumno.matricula?.toLowerCase().includes(busquedaAlumnos.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="text-blue-600" /> Gestión de Becas
          </h2>
          <p className="text-slate-500 mt-1">Administra las becas asignadas y configura nuevos tipos de descuento.</p>
        </div>
        
        {activeTab === 'ASIGNADAS' ? (
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#001429] text-white font-medium rounded-xl hover:bg-[#001f3f] transition-all shadow-sm"
          >
            <Plus size={18} /> Asignar Beca a Alumno
          </button>
        ) : (
          <button
            onClick={handleOpenNewBeca}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus size={18} /> Nueva Beca al Catálogo
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex space-x-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('ASIGNADAS')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ASIGNADAS' 
              ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Users size={16} /> Alumnos Becados
        </button>
        <button
          onClick={() => setActiveTab('CATALOGO')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'CATALOGO' 
              ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Award size={16} /> Catálogo de Becas
        </button>
      </div>

      {activeTab === 'ASIGNADAS' && (
        <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search size={18} className="text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Buscar alumnos becados por nombre o tipo de beca..."
                value={busquedaAlumnos}
                onChange={(e) => setBusquedaAlumnos(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-slate-700 text-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {loadingAsignaciones ? (
            <div className="flex items-center justify-center p-12 text-slate-400">Cargando alumnos becados...</div>
          ) : asignacionesFiltradas.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No hay alumnos becados</h3>
              <p className="text-slate-500 text-sm mt-1">Busca a un alumno para asignarle una beca o promoción.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600">Alumno</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Grado/Nivel</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Tipo de Beca</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-center">Descuento</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Ciclo Escolar</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {asignacionesFiltradas.map((a) => (
                      <tr key={a.asignacionId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{a.alumno.nombreCompleto}</div>
                          {a.alumno.matricula && <div className="text-xs text-slate-500 mt-0.5">{a.alumno.matricula}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {a.alumno.nivel?.nombre} - {a.alumno.grado?.nombre}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {a.beca.nombreBeca}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-emerald-700">
                            {Number(a.beca.porcentaje)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {a.ciclo.nombre}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingAsignacion(a)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Editar Asignación"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleRevokeAsignacion(a.asignacionId)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Revocar Beca"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'CATALOGO' && (
        <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search size={18} className="text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Buscar becas por nombre o criterio..."
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-slate-700 text-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {loadingBecas ? (
            <div className="flex items-center justify-center p-12 text-slate-400">Cargando catálogo...</div>
          ) : becasFiltradas.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
              <Award size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No se encontraron becas en el catálogo</h3>
              <p className="text-slate-500 text-sm mt-1">Intenta con otro término de búsqueda o crea una nueva beca.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600">Nombre de la Beca</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Criterio</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-center">Descuento</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Descripción</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {becasFiltradas.map((beca) => (
                      <tr key={beca.becaId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {beca.nombreBeca}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                            {beca.criterio.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                            {Number(beca.porcentaje)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]" title={beca.descripcion || ''}>
                          {beca.descripcion || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditBeca(beca)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBeca(beca.becaId)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BecaFormModal
        isOpen={isCatalogoModalOpen}
        onClose={() => setIsCatalogoModalOpen(false)}
        onSubmit={onSubmitBeca}
        initialData={editingBeca}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <BuscadorAsignarBecaModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAsignado={() => refetchAsignaciones()}
      />

      <EditarAsignacionModal
        isOpen={!!editingAsignacion}
        asignacion={editingAsignacion}
        onClose={() => setEditingAsignacion(null)}
        onActualizado={() => refetchAsignaciones()}
      />
    </div>
  );
}
