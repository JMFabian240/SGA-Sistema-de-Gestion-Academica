import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { useNavigate } from 'react-router-dom';
import { EditarTutorModal } from '../components/EditarTutorModal';
import { NuevoTutorModal } from '../../alumnos/components/NuevoTutorModal';

export function TutoresPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFactura, setFilterFactura] = useState('ALL');
  const [editingTutor, setEditingTutor] = useState<any>(null);
  const [isCreatingTutor, setIsCreatingTutor] = useState(false);

  const { data: tutores, isLoading } = trpc.tutores.getAll.useQuery();

  const deleteTutorMutation = trpc.tutores.delete.useMutation({
    onSuccess: () => {
      utils.tutores.getAll.invalidate();
    }
  });

  const currentData = useMemo(() => {
    if (!tutores) return [];

    let result = tutores;

    if (filterFactura === 'FACTURA') {
      result = result.filter((t: any) => !!t.datosFiscales);
    } else if (filterFactura === 'NO_FACTURA') {
      result = result.filter((t: any) => !t.datosFiscales);
    }

    if (searchTerm) {
      result = result.filter((t: any) =>
        t.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [tutores, searchTerm, filterFactura]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Directorio de Padres</h2>
          <p className="text-gray-500">Gestión de tutores y responsables</p>
        </div>
        <button
          onClick={() => setIsCreatingTutor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#001429] text-white font-medium rounded-xl hover:bg-[#001429]/90 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Nuevo tutor
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-white shrink-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors outline-none text-sm"
            />
          </div>

          <select
            value={filterFactura}
            onChange={(e) => setFilterFactura(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-600"
          >
            <option value="ALL">Todos los padres</option>
            <option value="FACTURA">Requieren factura</option>
            <option value="NO_FACTURA">No requieren factura</option>
          </select>

          <div className="flex-1"></div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Resultados: {currentData?.length || 0}</span>
            <button className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <Download size={16} /> Exportar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Cargando directorio de padres...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 font-medium border-b border-gray-100 bg-white">
                <tr>
                  <th className="px-6 py-4 font-semibold">Responsable</th>
                  <th className="px-6 py-4 font-semibold">Alumnos a Cargo</th>
                  <th className="px-6 py-4 font-semibold">Situación</th>
                  <th className="px-6 py-4 font-semibold text-center">Requiere Factura</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.map((t: any) => {
                  const alumnosAcargoList = t.tutoresAlumnos?.map((ta: any) => ta.alumno?.nombreCompleto) || [];
                  const totalAlumnos = alumnosAcargoList.length;
                  const esDeudor = t.tutoresAlumnos?.some((ta: any) => ta.alumno?.calendariosPagos?.length > 0);
                  const requiereFactura = !!t.datosFiscales;

                  return (
                    <tr key={t.tutorId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{t.nombreCompleto}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {t.correoElectronico ? t.correoElectronico : (t.telefono || 'Sin contacto')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {totalAlumnos > 0 ? (
                          <div>
                            <span className="font-medium text-gray-800">{totalAlumnos}</span>{' '}
                            <span className="text-gray-500">alumno{totalAlumnos > 1 ? 's' : ''}</span>
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]" title={alumnosAcargoList.join(', ')}>
                              {alumnosAcargoList.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Ninguno</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {esDeudor ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            Deudor
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Al Corriente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {requiereFactura ? (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                            Sí
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/tutores/${t.tutorId}`)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            Ver Info
                          </button>
                          <button
                            onClick={() => setEditingTutor(t)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Editar tutor"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('¿Estás seguro de que deseas dar de baja a este padre/tutor? Esta acción lo desactivará del sistema.')) {
                                try {
                                  await deleteTutorMutation.mutateAsync(t.tutorId);
                                } catch (error: any) {
                                  alert(error.message || 'Error al eliminar el tutor');
                                }
                              }
                            }}
                            disabled={deleteTutorMutation.isPending}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Eliminar tutor"
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
                      No se encontraron tutores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editingTutor && (
        <EditarTutorModal 
          isOpen={!!editingTutor}
          onClose={() => setEditingTutor(null)}
          tutor={editingTutor}
        />
      )}

      {isCreatingTutor && (
        <NuevoTutorModal 
          isOpen={isCreatingTutor}
          onClose={() => setIsCreatingTutor(false)}
          onSuccess={() => setIsCreatingTutor(false)}
        />
      )}
    </div>
  );
}
