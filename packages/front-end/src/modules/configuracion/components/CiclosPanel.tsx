import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Calendar, Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { CicloFormModal } from './CicloFormModal';

export function CiclosPanel() {
  const { data: ciclos, isLoading: loadingCiclos } = trpc.grupos.getCiclos.useQuery();
  const utils = trpc.useContext();

  const [isCicloModalOpen, setIsCicloModalOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<any>(null);

  const deleteCicloMutation = trpc.grupos.deleteCiclo.useMutation({
    onSuccess: () => {
      utils.grupos.getCiclos.invalidate();
    }
  });

  const handleOpenNewCiclo = () => {
    setEditingCiclo(null);
    setIsCicloModalOpen(true);
  };

  const handleOpenEditCiclo = (ciclo: any) => {
    setEditingCiclo(ciclo);
    setIsCicloModalOpen(true);
  };

  const handleDeleteCiclo = (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar este ciclo escolar de forma lógica?')) {
      deleteCicloMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleOpenNewCiclo}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Nuevo Ciclo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {loadingCiclos ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin" size={18} /> Cargando ciclos escolares...
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nombre del Ciclo</th>
                  <th className="px-6 py-4 font-semibold">Fecha de Inicio</th>
                  <th className="px-6 py-4 font-semibold">Fecha de Término</th>
                  <th className="px-6 py-4 font-semibold text-center">Periodicidad</th>
                  <th className="px-6 py-4 font-semibold text-center">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ciclos?.map((c: any) => (
                  <tr key={c.cicloId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                      <Calendar className="text-navy-500" size={18} />
                      {c.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(c.fechaInicio).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(c.fechaFin).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 capitalize font-medium">
                      {c.periodicidad?.toLowerCase() || 'Anual'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.activo 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEditCiclo(c)}
                          className="p-2 text-navy-600 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar Ciclo"
                        >
                          <Edit2 size={15} />
                        </button>
                        {!c.activo && (
                          <button
                            onClick={() => handleDeleteCiclo(c.cicloId)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Ciclo"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {ciclos?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No hay ciclos escolares registrados. Crea uno nuevo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CicloFormModal
        isOpen={isCicloModalOpen}
        onClose={() => setIsCicloModalOpen(false)}
        cicloId={editingCiclo?.cicloId}
        initialData={editingCiclo ? {
          nombre: editingCiclo.nombre,
          fechaInicio: new Date(editingCiclo.fechaInicio).toISOString().split('T')[0],
          fechaFin: new Date(editingCiclo.fechaFin).toISOString().split('T')[0],
          activo: editingCiclo.activo,
          periodicidad: editingCiclo.periodicidad
        } : undefined}
      />
    </div>
  );
}
