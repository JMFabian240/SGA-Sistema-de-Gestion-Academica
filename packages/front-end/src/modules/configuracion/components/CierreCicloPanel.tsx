import { useState, useEffect } from 'react';
import { trpc } from '../../../lib/trpc';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';

interface CierreCicloPanelProps {
  onTransicionarCiclo: (ciclo: any) => void;
}

export function CierreCicloPanel({ onTransicionarCiclo }: CierreCicloPanelProps) {
  const utils = trpc.useContext();
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const { data: grupos, isLoading: loadingGrupos } = trpc.grupos.getGrupos.useQuery();

  const [selectedGrupoCierreId, setSelectedGrupoCierreId] = useState<number | null>(null);
  const [promocionesState, setPromocionesState] = useState<Record<number, boolean>>({});
  const [retencionOverrides, setRetencionOverrides] = useState<Record<number, string>>({});
  const [showConfirmModal1, setShowConfirmModal1] = useState(false);
  const [showConfirmModal2, setShowConfirmModal2] = useState(false);
  const [confirmTextInput, setConfirmTextInput] = useState('');

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
      setRetencionOverrides({});
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

  const ciclosActivos = ciclos?.filter((c: any) => c.activo) || [];
  const ciclosReady = ciclosActivos.filter((ciclo: any) => {
    const gruposCiclo = grupos?.filter((g: any) => g.cicloId === ciclo.cicloId);
    return gruposCiclo && gruposCiclo.length > 0 && gruposCiclo.every((g: any) => g.cerrado);
  });

  return (
    <div className="space-y-6">
      {!selectedGrupoCierreId ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-navy-800">Cierre de Ciclo por Grupos</h3>
              <p className="text-xs text-gray-500">Selecciona un grupo para verificar el estado de sus alumnos y proceder con el cierre de ciclo.</p>
            </div>
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
                    <th className="px-6 py-4 font-semibold">Grado</th>
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
                      if (a.grado?.numero !== b.grado?.numero) {
                        return (a.grado?.numero || 0) - (b.grado?.numero || 0);
                      }
                      return a.nombre.localeCompare(b.nombre);
                    })
                    .map((g: any) => (
                      <tr key={g.grupoId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-navy-800">
                          {g.nivel.nombre}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {g.grado?.nombre || '-'}
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
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No hay grupos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!loadingGrupos && ciclosReady && ciclosReady.length > 0 && (
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
              {ciclosReady.map((ciclo: any) => (
                <button
                  key={ciclo.cicloId}
                  onClick={() => onTransicionarCiclo(ciclo)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm cursor-pointer text-sm"
                >
                  <CheckCircle size={18} />
                  Transicionar Ciclo {ciclo.nombre}
                </button>
              ))}
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
                      <th className="px-6 py-4 font-semibold text-center">Motivo (Opcional)</th>
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
                          {!promocionesState[a.alumnoId] && !(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado ? (
                            <select
                              className="text-xs border border-gray-300 rounded p-1"
                              value={retencionOverrides[a.alumnoId] || ''}
                              onChange={(e) => setRetencionOverrides(prev => ({
                                ...prev,
                                [a.alumnoId]: e.target.value
                              }))}
                            >
                              <option value="">Automático</option>
                              <option value="RETENCION_FINANCIERA">Financiera</option>
                              <option value="RETENCION_ACADEMICA">Académica</option>
                              <option value="BAJA_DEFINITIVA">Baja Definitiva</option>
                            </select>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
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
                const promociones = Object.keys(promocionesState).map(alumnoId => {
                  const promover = promocionesState[Number(alumnoId)];
                  const override = retencionOverrides[Number(alumnoId)];
                  return {
                    alumnoId: Number(alumnoId),
                    promover,
                    motivoRetencionOverride: (!promover && override) ? (override as 'RETENCION_FINANCIERA' | 'RETENCION_ACADEMICA' | 'BAJA_DEFINITIVA') : undefined
                  };
                });
                try {
                  await cerrarCicloGrupoMutation.mutateAsync({
                    grupoId: selectedGrupoCierreId!,
                    promociones
                  });
                  setShowConfirmModal2(false);
                } catch {
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
