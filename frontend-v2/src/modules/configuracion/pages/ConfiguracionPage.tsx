import { useState, useEffect } from 'react';
import { trpc } from '../../../lib/trpc';
import { 
  Plus, Edit2, Trash2, Calendar, DollarSign, RefreshCw, 
  AlertTriangle, Check, Info, CheckCircle 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { CicloFormModal } from '../components/CicloFormModal';

type TabType = 'ciclos' | 'tarifas' | 'cierre';

export function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ciclos');

  // --- Ciclos Escolares ---
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

  // --- Tarifas de Cobro ---
  const [selectedCicloId, setSelectedCicloId] = useState<number | undefined>(undefined);
  const { data: niveles, isLoading: loadingNiveles } = trpc.grupos.getNiveles.useQuery();
  
  // Fetch rates for the selected cycle
  const { data: tarifas, isLoading: loadingTarifas } = trpc.pagos.getTarifas.useQuery(
    selectedCicloId ? { cicloId: selectedCicloId } : undefined,
    { enabled: !!selectedCicloId }
  );

  const createTarifaMutation = trpc.pagos.createTarifa.useMutation();
  const updateTarifaMutation = trpc.pagos.updateTarifa.useMutation();

  const [tarifaValores, setTarifaValores] = useState<Record<string, string>>({});
  const [tarifaExisten, setTarifaExisten] = useState<Record<string, number>>({}); // maps key -> tarifaId
  const [guardandoTarifas, setGuardandoTarifas] = useState(false);
  const [tarifaSuccess, setTarifaSuccess] = useState(false);

  // Set default selected cycle when list loads
  useEffect(() => {
    if (ciclos && ciclos.length > 0 && !selectedCicloId) {
      const active = ciclos.find((c: any) => c.activo);
      setSelectedCicloId(active ? active.cicloId : ciclos[0].cicloId);
    }
  }, [ciclos, selectedCicloId]);

  // Load existing rates into form values
  useEffect(() => {
    if (tarifas && niveles) {
      const valores: Record<string, string> = {};
      const existen: Record<string, number> = {};

      // Initialize all keys
      niveles.forEach((n: any) => {
        ['INSCRIPCION', 'COLEGIATURA', 'MATERIAL', 'UNIFORME'].forEach((concepto) => {
          valores[`${n.nivelId}_${concepto}`] = '';
        });
      });

      // Populate from existing database rates
      tarifas.forEach((t: any) => {
        valores[`${t.nivelId}_${t.concepto}`] = String(t.monto);
        existen[`${t.nivelId}_${t.concepto}`] = t.tarifaId;
      });

      setTarifaValores(valores);
      setTarifaExisten(existen);
    }
  }, [tarifas, niveles]);

  const handleTarifaChange = (nivelId: number, concepto: string, value: string) => {
    setTarifaValores(prev => ({
      ...prev,
      [`${nivelId}_${concepto}`]: value
    }));
  };

  const handleSaveTarifas = async () => {
    if (!selectedCicloId || !niveles) return;
    setGuardandoTarifas(true);
    setTarifaSuccess(false);

    try {
      const conceptos = ['INSCRIPCION', 'COLEGIATURA', 'MATERIAL', 'UNIFORME'];
      
      for (const n of niveles) {
        for (const c of conceptos) {
          const key = `${n.nivelId}_${c}`;
          const val = tarifaValores[key];
          if (!val) continue; // Skip empty fields

          const monto = Number(val);
          if (isNaN(monto) || monto < 0) continue;

          const tarifaId = tarifaExisten[key];

          if (tarifaId) {
            // Update existing
            await updateTarifaMutation.mutateAsync({
              tarifaId,
              monto,
              concepto: c,
              cicloId: selectedCicloId,
              nivelId: n.nivelId
            });
          } else {
            // Create new
            await createTarifaMutation.mutateAsync({
              cicloId: selectedCicloId,
              nivelId: n.nivelId,
              concepto: c,
              monto
            });
          }
        }
      }

      setTarifaSuccess(true);
      utils.pagos.getTarifas.invalidate({ cicloId: selectedCicloId });
      setTimeout(() => setTarifaSuccess(false), 3000);
    } catch (err) {
      alert('Ocurrió un error al guardar algunas tarifas.');
    } finally {
      setGuardandoTarifas(false);
    }
  };

  // --- Cierre de Ciclo por Grupos ---
  const [selectedGrupoCierreId, setSelectedGrupoCierreId] = useState<number | null>(null);
  const [promocionesState, setPromocionesState] = useState<Record<number, boolean>>({});
  const [showConfirmModal1, setShowConfirmModal1] = useState(false);
  const [showConfirmModal2, setShowConfirmModal2] = useState(false);
  const [confirmTextInput, setConfirmTextInput] = useState('');

  const { data: grupos, isLoading: loadingGrupos } = trpc.grupos.getGrupos.useQuery();
  const { data: alumnosCierre, isLoading: loadingAlumnosCierre } = trpc.grupos.getAlumnosCierreGrupo.useQuery(
    { grupoId: selectedGrupoCierreId! },
    { enabled: !!selectedGrupoCierreId }
  );

  useEffect(() => {
    if (alumnosCierre) {
      const initial: Record<number, boolean> = {};
      alumnosCierre.forEach((a: any) => {
        initial[a.alumnoId] = !(a.tieneAdeudo || a.tieneReprobadas);
      });
      setPromocionesState(initial);
    }
  }, [alumnosCierre]);

  const cerrarCicloGrupoMutation = trpc.grupos.cerrarCicloGrupo.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      setSelectedGrupoCierreId(null);
      alert('Cierre de ciclo de grupo ejecutado exitosamente.');
    },
    onError: (err) => {
      alert(err.message || 'Error al ejecutar el cierre de ciclo.');
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Title */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-800">Configuración General</h2>
          <p className="text-gray-500">Gestión de reglas de negocio, ciclos escolares y tarifas financieras</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ciclos')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'ciclos'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Ciclos Escolares
        </button>
        <button
          onClick={() => setActiveTab('tarifas')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'tarifas'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Finanzas y Tarifas
        </button>
        <button
          onClick={() => setActiveTab('cierre')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'cierre'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Operaciones de Ciclo
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'ciclos' && (
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
        )}

        {activeTab === 'tarifas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grid de tarifas (Izquierda) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-red-600" size={20} />
                    <h3 className="font-bold text-navy-800 text-lg">Tarifas por Nivel Educativo</h3>
                  </div>
                  
                  {/* Selector de Ciclo */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Ciclo Escolar:</span>
                    <select
                      value={selectedCicloId || ''}
                      onChange={(e) => setSelectedCicloId(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-navy-500 bg-white"
                    >
                      {ciclos?.map((c: any) => (
                        <option key={c.cicloId} value={c.cicloId}>
                          {c.nombre} {c.activo ? '(Activo)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadingNiveles || loadingTarifas ? (
                  <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Cargando tarifas financieras...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-600 text-xs uppercase">
                          <th className="py-3 font-semibold">Nivel Educativo</th>
                          <th className="py-3 font-semibold text-center">Inscripción ($)</th>
                          <th className="py-3 font-semibold text-center">Colegiatura ($)</th>
                          <th className="py-3 font-semibold text-center">Materiales ($)</th>
                          <th className="py-3 font-semibold text-center">Uniforme ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {niveles?.map((n: any) => (
                          <tr key={n.nivelId}>
                            <td className="py-4 font-bold text-navy-800">{n.nombre}</td>
                            <td className="py-4 text-center">
                              <input
                                type="number"
                                value={tarifaValores[`${n.nivelId}_INSCRIPCION`] || ''}
                                onChange={(e) => handleTarifaChange(n.nivelId, 'INSCRIPCION', e.target.value)}
                                className="w-24 text-center py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-navy-500 font-medium"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-4 text-center">
                              <input
                                type="number"
                                value={tarifaValores[`${n.nivelId}_COLEGIATURA`] || ''}
                                onChange={(e) => handleTarifaChange(n.nivelId, 'COLEGIATURA', e.target.value)}
                                className="w-24 text-center py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-navy-500 font-medium"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-4 text-center">
                              <input
                                type="number"
                                value={tarifaValores[`${n.nivelId}_MATERIAL`] || ''}
                                onChange={(e) => handleTarifaChange(n.nivelId, 'MATERIAL', e.target.value)}
                                className="w-24 text-center py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-navy-500 font-medium"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-4 text-center">
                              <input
                                type="number"
                                value={tarifaValores[`${n.nivelId}_UNIFORME`] || ''}
                                onChange={(e) => handleTarifaChange(n.nivelId, 'UNIFORME', e.target.value)}
                                className="w-24 text-center py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-navy-500 font-medium"
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 items-center">
                  {tarifaSuccess && (
                    <span className="text-green-600 text-sm font-semibold flex items-center gap-1.5 animate-in fade-in">
                      <Check size={16} /> Tarifas guardadas con éxito
                    </span>
                  )}
                  <button
                    onClick={handleSaveTarifas}
                    disabled={guardandoTarifas || loadingTarifas}
                    className="px-6 py-2 bg-navy-500 text-white rounded-xl font-medium hover:bg-navy-600 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {guardandoTarifas ? 'Guardando...' : 'Guardar Tarifas'}
                  </button>
                </div>
              </div>
            </div>

            {/* Pronto pago e instructivo (Derecha) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <CheckCircle className="text-green-600" size={18} />
                  <h4 className="font-bold text-navy-800">Promoción Pronto Pago</h4>
                </div>
                <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-green-800">15% de Descuento</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Activo</span>
                  </div>
                  <p className="text-xs text-green-700">Aplica para mensualidades pagadas durante los primeros 10 días de cada mes lectivo.</p>
                  <div className="text-[10px] text-green-600 pt-2 border-t border-green-100 flex justify-between">
                    <span>Inicio: 01/01/2026</span>
                    <span>Fin: 31/12/2026</span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 cursor-not-allowed text-center"
                >
                  + Nueva Promoción (Deshabilitado en Demo)
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 font-semibold border-b border-gray-100 pb-2">
                  <Info size={16} />
                  <span className="text-sm">Configuraciones de Cobro</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Las tarifas aquí definidas representan los costos base para el ciclo seleccionado. Cuando un alumno sea inscrito, se le aplicarán de forma proporcional o total estos conceptos según su nivel educativo correspondiente.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cierre' && (
          <div className="space-y-6">
            {!selectedGrupoCierreId ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-navy-800">Cierre de Ciclo por Grupos</h3>
                  <p className="text-xs text-gray-500">Selecciona un grupo para verificar el estado de sus alumnos y proceder con el cierre de ciclo.</p>
                </div>

                {loadingGrupos ? (
                  <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Cargando grupos escolares...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Nivel Educativo</th>
                          <th className="px-6 py-4 font-semibold">Grupo</th>
                          <th className="px-6 py-4 font-semibold">Ciclo Escolar</th>
                          <th className="px-6 py-4 font-semibold text-center">Estado del Ciclo</th>
                          <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...(grupos || [])]
                          .sort((a: any, b: any) => {
                            if (a.nivel.orden !== b.nivel.orden) {
                              return a.nivel.orden - b.nivel.orden;
                            }
                            const numA = parseInt(a.nombre) || 0;
                            const numB = parseInt(b.nombre) || 0;
                            if (numA !== numB) {
                              return numA - numB;
                            }
                            return a.nombre.localeCompare(b.nombre);
                          })
                          .map((g: any) => (
                            <tr key={g.grupoId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-navy-800">
                                {g.nivel.nombre}
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900">
                                {g.nombre}
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                {g.ciclo.nombre}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  g.cerrado 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                  {g.cerrado ? 'Cerrado / Archivado' : 'Abierto / Cursando'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant={g.cerrado ? 'ghost' : 'primary'}
                                  onClick={() => setSelectedGrupoCierreId(g.grupoId)}
                                  className="rounded-xl text-xs py-1.5 px-3"
                                >
                                  {g.cerrado ? 'Ver Expedientes' : 'Verificar y Cerrar'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        {grupos?.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                              No hay grupos registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div>
                    <button
                      onClick={() => setSelectedGrupoCierreId(null)}
                      className="text-xs font-bold text-navy-500 hover:text-navy-700 flex items-center gap-1 mb-1 cursor-pointer"
                    >
                      ← Volver a lista de grupos
                    </button>
                    <h3 className="text-lg font-bold text-navy-800">
                      Cierre de Ciclo — Grupo {(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.nombre} ({(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.nivel.nombre})
                    </h3>
                    <p className="text-xs text-gray-500">Revisa la elegibilidad académica y financiera de los alumnos antes de cerrar.</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    (grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado
                      ? 'bg-red-50 text-red-700 border border-red-100' 
                      : 'bg-green-50 text-green-700 border border-green-100'
                  }`}>
                    {(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado ? 'Cerrado' : 'Abierto'}
                  </span>
                </div>

                {loadingAlumnosCierre ? (
                  <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Cargando alumnos del grupo...
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Matrícula</th>
                            <th className="px-6 py-4 font-semibold">Nombre Completo</th>
                            <th className="px-6 py-4 font-semibold">CURP</th>
                            <th className="px-6 py-4 font-semibold text-center">Estado Académico</th>
                            <th className="px-6 py-4 font-semibold text-center">Estado Financiero</th>
                            <th className="px-6 py-4 font-semibold text-center">Promover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {alumnosCierre?.map((a: any) => (
                            <tr key={a.alumnoId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-gray-500">{a.matricula || '-'}</td>
                              <td className="px-6 py-4 font-bold text-gray-900">{a.nombreCompleto}</td>
                              <td className="px-6 py-4 text-gray-500 font-mono text-xs">{a.curp}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  a.tieneReprobadas 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                  {a.tieneReprobadas ? 'Materias Reprobadas' : 'Regular'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  a.tieneAdeudo 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                  {a.tieneAdeudo ? 'Adeudo Pendiente' : 'Al Corriente'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <input
                                  type="checkbox"
                                  disabled={a.tieneAdeudo || a.tieneReprobadas || (grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado}
                                  checked={!!promocionesState[a.alumnoId]}
                                  onChange={(e) => {
                                    setPromocionesState(prev => ({
                                      ...prev,
                                      [a.alumnoId]: e.target.checked
                                    }));
                                  }}
                                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))}
                          {alumnosCierre?.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                No hay alumnos inscritos en este grupo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {!(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado && (
                      <div className="flex justify-between items-center p-4 bg-slate-50 border border-gray-100 rounded-2xl">
                        <span className="text-xs text-gray-500 leading-relaxed max-w-md">
                          <strong>Aviso:</strong> Cerrar el ciclo escolar de este grupo bloqueará la edición de calificaciones y boletas. Los alumnos pasarán a estatus de <em>Transición Pendiente</em> hasta que se inscriban en el siguiente periodo.
                        </span>
                        <Button
                          variant="danger"
                          className="bg-red-600 hover:bg-red-700 shadow-sm rounded-xl px-6 py-2.5 font-bold cursor-pointer"
                          disabled={!alumnosCierre || alumnosCierre.length === 0}
                          onClick={() => setShowConfirmModal1(true)}
                        >
                          <AlertTriangle size={18} className="mr-2" /> Cerrar Ciclo de Grupo
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showConfirmModal1}
        onClose={() => setShowConfirmModal1(false)}
        title="Confirmación de Cierre de Ciclo"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-start gap-2.5">
            <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={18} />
            <p className="text-xs text-red-700">
              ¡ATENCIÓN! Esta operación es irreversible. Archivar los expedientes de este grupo congelará sus calificaciones y bloqueará cualquier edición futura de boletas para este periodo.
            </p>
          </div>
          <p className="text-sm text-navy-800">
            ¿Deseas continuar con el proceso de cierre para este grupo?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowConfirmModal1(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              onClick={() => {
                setShowConfirmModal1(false);
                setConfirmTextInput('');
                setShowConfirmModal2(true);
              }}
            >
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmModal2}
        onClose={() => setShowConfirmModal2(false)}
        title="Doble Confirmación Requerida"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Para autorizar el cierre, escribe la palabra <strong className="text-red-600">"CONFIRMAR"</strong> (en mayúsculas) a continuación:
          </p>
          <Input
            value={confirmTextInput}
            onChange={(e) => setConfirmTextInput(e.target.value)}
            placeholder="Escribe CONFIRMAR"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowConfirmModal2(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
              disabled={confirmTextInput !== 'CONFIRMAR' || cerrarCicloGrupoMutation.isPending}
              onClick={async () => {
                const promociones = Object.keys(promocionesState).map(alumnoId => ({
                  alumnoId: Number(alumnoId),
                  promover: promocionesState[Number(alumnoId)]
                }));
                try {
                  await cerrarCicloGrupoMutation.mutateAsync({
                    grupoId: selectedGrupoCierreId!,
                    promociones
                  });
                  setShowConfirmModal2(false);
                } catch (e) {
                  // error handles in mutation
                }
              }}
            >
              {cerrarCicloGrupoMutation.isPending ? 'Cerrando...' : 'Confirmar Cierre'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
