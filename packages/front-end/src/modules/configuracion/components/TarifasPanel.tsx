import { useState, useEffect, useMemo } from 'react';
import { trpc } from '../../../lib/trpc';
import { 
  DollarSign, RefreshCw, Check, CheckCircle, Info, Plus, Edit2, Trash2 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export function TarifasPanel() {
  const utils = trpc.useContext();
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const { data: niveles, isLoading: loadingNiveles } = trpc.grupos.getNiveles.useQuery();

  // --- Tarifas de Cobro (ANUAL) ---
  const [selectedCicloId, setSelectedCicloId] = useState<number | undefined>(undefined);
  
  const { data: configuracionGlobal } = trpc.configuracion.get.useQuery();
  const updateConfiguracionMutation = trpc.configuracion.update.useMutation({
    onSuccess: () => {
      utils.configuracion.get.invalidate();
    }
  });

  const { data: recargos, isLoading: loadingRecargos } = trpc.configuracion.getRecargos.useQuery();
  const createRecargoMutation = trpc.configuracion.createRecargo.useMutation({
    onSuccess: () => {
      utils.configuracion.getRecargos.invalidate();
    }
  });
  const updateRecargoMutation = trpc.configuracion.updateRecargo.useMutation({
    onSuccess: () => {
      utils.configuracion.getRecargos.invalidate();
    }
  });

  const [editandoConfiguracion, setEditandoConfiguracion] = useState(false);
  const [configValores, setConfigValores] = useState({
    diaVencimientoMensual: '1'
  });

  // Estados para el Modal de Recargo
  const [modalRecargoOpen, setModalRecargoOpen] = useState(false);
  const [recargoEditando, setRecargoEditando] = useState<any>(null);
  const [recargoForm, setRecargoForm] = useState({
    concepto: 'COLEGIATURA',
    llevaRecargo: true,
    monto: '0',
    diasGracia: '0'
  });

  const abrirModalRecargo = (recargo?: any) => {
    if (recargo) {
      setRecargoEditando(recargo);
      setRecargoForm({
        concepto: recargo.conceptoPago,
        llevaRecargo: Number(recargo.monto) > 0,
        monto: recargo.monto.toString(),
        diasGracia: recargo.diasGracia.toString()
      });
    } else {
      setRecargoEditando(null);
      setRecargoForm({
        concepto: 'COLEGIATURA',
        llevaRecargo: true,
        monto: '0',
        diasGracia: '0'
      });
    }
    setModalRecargoOpen(true);
  };

  const handleSaveRecargoForm = () => {
    if (!recargoForm.concepto) return alert('Selecciona un concepto');
    const monto = recargoForm.llevaRecargo ? Number(recargoForm.monto) : 0;
    const diasGracia = Number(recargoForm.diasGracia);

    if (isNaN(monto) || isNaN(diasGracia)) return alert('Valores numéricos inválidos');

    if (recargoEditando) {
      updateRecargoMutation.mutate({
        id: recargoEditando.id,
        monto,
        diasGracia
      }, {
        onSuccess: () => setModalRecargoOpen(false)
      });
    } else {
      createRecargoMutation.mutate({
        conceptoPago: recargoForm.concepto,
        monto,
        diasGracia
      }, {
        onSuccess: () => setModalRecargoOpen(false)
      });
    }
  };

  useEffect(() => {
    if (configuracionGlobal) {
      setConfigValores({
        diaVencimientoMensual: configuracionGlobal.diaVencimientoMensual?.toString() || '1'
      });
    }
  }, [configuracionGlobal]);

  const handleSaveConfiguracion = async () => {
    try {
      await updateConfiguracionMutation.mutateAsync({
        diaVencimientoMensual: parseInt(configValores.diaVencimientoMensual, 10)
      });
      setEditandoConfiguracion(false);
    } catch (error: any) {
      alert(error.message || 'Error al guardar la configuración');
    }
  };

  const { data: tarifas, isLoading: loadingTarifas } = trpc.pagos.getTarifas.useQuery(
    selectedCicloId ? { cicloId: selectedCicloId } : undefined,
    { enabled: !!selectedCicloId }
  );

  const createTarifaMutation = trpc.pagos.createTarifa.useMutation();
  const updateTarifaMutation = trpc.pagos.updateTarifa.useMutation();

  const [tarifaValores, setTarifaValores] = useState<Record<string, string>>({});
  const [tarifaExisten, setTarifaExisten] = useState<Record<string, number>>({});
  const [guardandoTarifas, setGuardandoTarifas] = useState(false);
  const [tarifaSuccess, setTarifaSuccess] = useState(false);
  const [editandoTarifas, setEditandoTarifas] = useState(false);

  // --- Tarifas de Cobro (SEMESTRAL) ---
  const [selectedCicloSemId, setSelectedCicloSemId] = useState<number | undefined>(undefined);

  const { data: tarifasSem, isLoading: loadingTarifasSem } = trpc.pagos.getTarifas.useQuery(
    selectedCicloSemId ? { cicloId: selectedCicloSemId } : undefined,
    { enabled: !!selectedCicloSemId }
  );

  const [tarifaValoresSem, setTarifaValoresSem] = useState<Record<string, string>>({});
  const [tarifaExistenSem, setTarifaExistenSem] = useState<Record<string, number>>({});
  const [guardandoTarifasSem, setGuardandoTarifasSem] = useState(false);
  const [tarifaSuccessSem, setTarifaSuccessSem] = useState(false);
  const [editandoTarifasSem, setEditandoTarifasSem] = useState(false);

  // Listas de ciclos filtradas por periodicidad
  const ciclosAnuales = useMemo(() => ciclos?.filter((c: any) => c.periodicidad !== 'SEMESTRAL') || [], [ciclos]);
  const ciclosSemestrales = useMemo(() => ciclos?.filter((c: any) => c.periodicidad === 'SEMESTRAL') || [], [ciclos]);

  // Niveles filtrados
  const nivelesAnuales = useMemo(() => niveles?.filter((n: any) => n.codigo !== 'BAC'), [niveles]);
  const nivelesSemestrales = useMemo(() => niveles?.filter((n: any) => n.codigo === 'BAC'), [niveles]);

  const selectedCiclo = ciclos?.find((c: any) => c.cicloId === selectedCicloId);
  const selectedCicloSem = ciclos?.find((c: any) => c.cicloId === selectedCicloSemId);

  // --- Efectos ANUAL ---
  useEffect(() => {
    setEditandoTarifas(false);
  }, [selectedCicloId]);

  useEffect(() => {
    if (ciclosAnuales.length > 0 && !selectedCicloId) {
      const active = ciclosAnuales.find((c: any) => c.activo);
      setSelectedCicloId(active ? active.cicloId : ciclosAnuales[0].cicloId);
    }
  }, [ciclosAnuales, selectedCicloId]);

  useEffect(() => {
    if (tarifas && nivelesAnuales) {
      const valores: Record<string, string> = {};
      const existen: Record<string, number> = {};
      nivelesAnuales.forEach((n: any) => {
        ['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'LIBROS', 'UNIFORME', 'COLEGIATURA'].forEach((concepto) => {
          valores[`${n.nivelId}_${concepto}`] = '';
        });
      });
      tarifas.forEach((t: any) => {
        valores[`${t.nivelId}_${t.concepto}`] = String(t.monto);
        existen[`${t.nivelId}_${t.concepto}`] = t.tarifaId;
      });
      setTarifaValores(valores);
      setTarifaExisten(existen);
    }
  }, [tarifas, nivelesAnuales]);

  // --- Efectos SEMESTRAL ---
  useEffect(() => {
    setEditandoTarifasSem(false);
  }, [selectedCicloSemId]);

  useEffect(() => {
    if (ciclosSemestrales.length > 0 && !selectedCicloSemId) {
      const active = ciclosSemestrales.find((c: any) => c.activo);
      setSelectedCicloSemId(active ? active.cicloId : ciclosSemestrales[0].cicloId);
    }
  }, [ciclosSemestrales, selectedCicloSemId]);

  useEffect(() => {
    if (tarifasSem && nivelesSemestrales) {
      const valores: Record<string, string> = {};
      const existen: Record<string, number> = {};
      nivelesSemestrales.forEach((n: any) => {
        ['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'LIBROS', 'UNIFORME', 'COLEGIATURA'].forEach((concepto) => {
          valores[`${n.nivelId}_${concepto}`] = '';
        });
      });
      tarifasSem.forEach((t: any) => {
        valores[`${t.nivelId}_${t.concepto}`] = String(t.monto);
        existen[`${t.nivelId}_${t.concepto}`] = t.tarifaId;
      });
      setTarifaValoresSem(valores);
      setTarifaExistenSem(existen);
    }
  }, [tarifasSem, nivelesSemestrales]);

  // --- Handlers ANUAL ---
  const handleTarifaChange = (nivelId: number, concepto: string, value: string) => {
    setTarifaValores(prev => ({
      ...prev,
      [`${nivelId}_${concepto}`]: value
    }));
  };

  const handleTarifaChangeSem = (nivelId: number, concepto: string, value: string) => {
    setTarifaValoresSem(prev => ({
      ...prev,
      [`${nivelId}_${concepto}`]: value
    }));
  };

  const handleSaveTarifas = async () => {
    if (!selectedCicloId || !nivelesAnuales) return;
    const conceptos = ['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'LIBROS', 'UNIFORME', 'COLEGIATURA'];
    let hasNegative = false;
    let hasInvalid = false;
    for (const n of nivelesAnuales) {
      for (const c of conceptos) {
        const val = tarifaValores[`${n.nivelId}_${c}`];
        if (!val) continue;
        const monto = Number(val);
        if (isNaN(monto)) hasInvalid = true;
        else if (monto < 0) hasNegative = true;
      }
    }
    if (hasInvalid) { alert("Error de validación: Se han ingresado valores numéricos inválidos."); return; }
    if (hasNegative) { alert("Error de validación: No se permiten montos negativos."); return; }
    setGuardandoTarifas(true);
    setTarifaSuccess(false);
    try {
      for (const n of nivelesAnuales) {
        for (const c of conceptos) {
          const key = `${n.nivelId}_${c}`;
          const val = tarifaValores[key];
          if (!val) continue;
          const monto = Number(val);
          const tarifaId = tarifaExisten[key];
          if (tarifaId) {
            await updateTarifaMutation.mutateAsync({ tarifaId, monto, concepto: c, cicloId: selectedCicloId, nivelId: n.nivelId });
          } else {
            await createTarifaMutation.mutateAsync({ cicloId: selectedCicloId, nivelId: n.nivelId, concepto: c, monto });
          }
        }
      }
      setTarifaSuccess(true);
      setEditandoTarifas(false);
      utils.pagos.getTarifas.invalidate({ cicloId: selectedCicloId });
      setTimeout(() => setTarifaSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Excepción: Ocurrió un error al guardar algunas tarifas.');
    } finally {
      setGuardandoTarifas(false);
    }
  };

  const handleSaveTarifasSem = async () => {
    if (!selectedCicloSemId || !nivelesSemestrales) return;
    const conceptos = ['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'LIBROS', 'UNIFORME', 'COLEGIATURA'];
    let hasNegative = false;
    let hasInvalid = false;
    for (const n of nivelesSemestrales) {
      for (const c of conceptos) {
        const val = tarifaValoresSem[`${n.nivelId}_${c}`];
        if (!val) continue;
        const monto = Number(val);
        if (isNaN(monto)) hasInvalid = true;
        else if (monto < 0) hasNegative = true;
      }
    }
    if (hasInvalid) { alert("Error de validación: Se han ingresado valores numéricos inválidos."); return; }
    if (hasNegative) { alert("Error de validación: No se permiten montos negativos."); return; }
    setGuardandoTarifasSem(true);
    setTarifaSuccessSem(false);
    try {
      for (const n of nivelesSemestrales) {
        for (const c of conceptos) {
          const key = `${n.nivelId}_${c}`;
          const val = tarifaValoresSem[key];
          if (!val) continue;
          const monto = Number(val);
          const tarifaId = tarifaExistenSem[key];
          if (tarifaId) {
            await updateTarifaMutation.mutateAsync({ tarifaId, monto, concepto: c, cicloId: selectedCicloSemId, nivelId: n.nivelId });
          } else {
            await createTarifaMutation.mutateAsync({ cicloId: selectedCicloSemId, nivelId: n.nivelId, concepto: c, monto });
          }
        }
      }
      setTarifaSuccessSem(true);
      setEditandoTarifasSem(false);
      utils.pagos.getTarifas.invalidate({ cicloId: selectedCicloSemId });
      setTimeout(() => setTarifaSuccessSem(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Excepción: Ocurrió un error al guardar algunas tarifas semestrales.');
    } finally {
      setGuardandoTarifasSem(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Grid de tarifas (Izquierda) */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-8">
          
          {/* === SECCIÓN ANUAL === */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="text-red-600" size={20} />
                <h3 className="font-bold text-navy-800 text-lg">Tarifas por Nivel Educativo</h3>
                <span className="text-[10px] font-semibold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">Ciclo Anual</span>
              </div>
              
              {/* Selector de Ciclo Anual */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Ciclo Escolar:</span>
                <select
                  value={selectedCicloId || ''}
                  onChange={(e) => setSelectedCicloId(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-navy-500 bg-white"
                >
                  {ciclosAnuales.map((c: any) => (
                    <option key={c.cicloId} value={c.cicloId}>
                      {c.nombre} {c.activo ? '(Activo)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ciclosAnuales.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No hay ciclos escolares anuales registrados.
              </div>
            ) : loadingNiveles || loadingTarifas ? (
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
                      <th className="py-3 font-semibold text-center">Arancel ($)</th>
                      <th className="py-3 font-semibold text-center">Materiales ($)</th>
                      <th className="py-3 font-semibold text-center">Libros ($)</th>
                      <th className="py-3 font-semibold text-center">Uniforme ($)</th>
                      <th className="py-3 font-semibold text-center">Colegiatura ($ / Anual)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {nivelesAnuales?.map((n: any) => (
                      <tr key={n.nivelId}>
                        <td className="py-4 font-bold text-navy-800">{n.nombre}</td>
                        {['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'LIBROS', 'UNIFORME', 'COLEGIATURA'].map((c) => (
                          <td key={c} className="py-4 text-center">
                            <input
                              type="number"
                              disabled={!editandoTarifas}
                              value={tarifaValores[`${n.nivelId}_${c}`] || ''}
                              onChange={(e) => handleTarifaChange(n.nivelId, c, e.target.value)}
                              className="w-20 text-center py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-navy-500 font-medium disabled:bg-gray-50 disabled:text-gray-400"
                              placeholder="0.00"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 items-center">
              {tarifaSuccess && (
                <span className="text-green-600 text-sm font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <Check size={16} /> Tarifas guardadas con éxito
                </span>
              )}
              {selectedCiclo?.activo ? (
                editandoTarifas ? (
                  <Button
                    onClick={handleSaveTarifas}
                    isLoading={guardandoTarifas}
                    disabled={loadingTarifas}
                    variant="primary"
                    className="rounded-xl px-6 py-2 font-medium"
                  >
                    Guardar Montos
                  </Button>
                ) : (
                  <Button
                    onClick={() => setEditandoTarifas(true)}
                    disabled={loadingTarifas}
                    variant="primary"
                    className="rounded-xl px-6 py-2 font-medium"
                  >
                    Modificar Montos
                  </Button>
                )
              ) : (
                <span className="text-gray-400 text-xs font-semibold uppercase italic bg-gray-50 border border-gray-150 px-3 py-2 rounded-xl">
                  Solo lectura (Ciclo Inactivo)
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6"></div>

          {/* === SECCIÓN SEMESTRAL (BACHILLERATO) === */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="text-purple-600" size={20} />
                <h3 className="font-bold text-navy-800 text-lg">Tarifas de Bachillerato</h3>
                <span className="text-[10px] font-semibold uppercase bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full">Ciclo Semestral</span>
              </div>
              
              {/* Selector de Ciclo Semestral */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Ciclo Escolar:</span>
                <select
                  value={selectedCicloSemId || ''}
                  onChange={(e) => setSelectedCicloSemId(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  {ciclosSemestrales.map((c: any) => (
                    <option key={c.cicloId} value={c.cicloId}>
                      {c.nombre} {c.activo ? '(Activo)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ciclosSemestrales.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No hay ciclos escolares semestrales registrados.
              </div>
            ) : loadingNiveles || loadingTarifasSem ? (
              <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin" size={18} /> Cargando tarifas de bachillerato...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-600 text-xs uppercase">
                      <th className="py-3 font-semibold">Nivel Educativo</th>
                      <th className="py-3 font-semibold text-center">Inscripción ($)</th>
                      <th className="py-3 font-semibold text-center">Arancel ($)</th>
                      <th className="py-3 font-semibold text-center">Materiales ($)</th>
                      <th className="py-3 font-semibold text-center">Libros ($)</th>
                      <th className="py-3 font-semibold text-center">Uniforme ($)</th>
                      <th className="py-3 font-semibold text-center">Colegiatura ($ / Anual)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {nivelesSemestrales?.map((n: any) => (
                      <tr key={n.nivelId}>
                        <td className="py-4 font-bold text-navy-800">{n.nombre}</td>
                        {['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'LIBROS', 'UNIFORME', 'COLEGIATURA'].map((c) => (
                          <td key={c} className="py-4 text-center">
                            <input
                              type="number"
                              disabled={!editandoTarifasSem}
                              value={tarifaValoresSem[`${n.nivelId}_${c}`] || ''}
                              onChange={(e) => handleTarifaChangeSem(n.nivelId, c, e.target.value)}
                              className="w-20 text-center py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium disabled:bg-gray-50 disabled:text-gray-400"
                              placeholder="0.00"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 items-center">
              {tarifaSuccessSem && (
                <span className="text-green-600 text-sm font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <Check size={16} /> Tarifas guardadas con éxito
                </span>
              )}
              {selectedCicloSem?.activo ? (
                editandoTarifasSem ? (
                  <Button
                    onClick={handleSaveTarifasSem}
                    isLoading={guardandoTarifasSem}
                    disabled={loadingTarifasSem}
                    variant="primary"
                    className="rounded-xl px-6 py-2 font-medium"
                  >
                    Guardar Montos
                  </Button>
                ) : (
                  <Button
                    onClick={() => setEditandoTarifasSem(true)}
                    disabled={loadingTarifasSem}
                    variant="primary"
                    className="rounded-xl px-6 py-2 font-medium"
                  >
                    Modificar Montos
                  </Button>
                )
              ) : (
                <span className="text-gray-400 text-xs font-semibold uppercase italic bg-gray-50 border border-gray-150 px-3 py-2 rounded-xl">
                  Solo lectura (Ciclo Inactivo)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pronto pago e instructivo (Derecha) */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <CheckCircle className="text-orange-600" size={18} />
            <h4 className="font-bold text-navy-800">Recargos y Plazos</h4>
          </div>
          
          {configuracionGlobal ? (
            editandoConfiguracion ? (
              <div className="space-y-3">
                <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-2">
                  <label className="text-sm font-bold text-orange-800">Día de Vencimiento Mensual</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={configValores.diaVencimientoMensual}
                    onChange={(e) => setConfigValores({ ...configValores, diaVencimientoMensual: e.target.value })}
                    className="bg-white text-xs h-8"
                  />
                  <p className="text-xs text-orange-700 mt-1">Día del mes (1-31) límite para pagar las mensualidades.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-orange-800">Día de Cobro Global</span>
                    <span className="text-xs font-bold text-orange-700">Día {configuracionGlobal.diaVencimientoMensual} de cada mes</span>
                  </div>
                  <p className="text-xs text-orange-700">Aplica como límite a las mensualidades (ej. Colegiatura).</p>
                </div>
              </div>
            )
          ) : (
            <div className="text-center text-gray-400 text-sm py-4">Cargando configuración...</div>
          )}
          
          {editandoConfiguracion ? (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                className="w-full py-2 rounded-xl text-xs"
                onClick={() => {
                  setEditandoConfiguracion(false);
                  setConfigValores({
                    diaVencimientoMensual: configuracionGlobal?.diaVencimientoMensual?.toString() || '1'
                  });
                }}
                disabled={updateConfiguracionMutation.isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="w-full py-2 rounded-xl text-xs"
                onClick={handleSaveConfiguracion}
                isLoading={updateConfiguracionMutation.isLoading}
              >
                Guardar
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditandoConfiguracion(true)}
              className="w-full py-2 border border-dashed border-navy-300 rounded-xl text-xs font-semibold text-navy-600 hover:bg-navy-50 text-center mt-2"
            >
              Modificar Configuración
            </button>
          )}

          {/* Recargos Personalizados Integrados */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-navy-800">Recargos por Concepto Específico</span>
              <Button
                variant="outline"
                className="text-xs px-3 py-1 h-auto"
                onClick={() => abrirModalRecargo()}
              >
                <Plus size={14} className="mr-1" /> Añadir
              </Button>
            </div>
            
            {loadingRecargos ? (
              <div className="text-center text-gray-400 text-sm py-4">Cargando recargos...</div>
            ) : recargos && recargos.length > 0 ? (
              <div className="space-y-2 mt-2">
                {recargos.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-navy-800">{r.conceptoPago}</p>
                      <p className="text-xs text-gray-500">
                        Recargo: <span className="font-semibold text-red-600">${r.monto}</span> • Gracia: {r.diasGracia} días
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModalRecargo(r)}
                        className="p-1.5 text-navy-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Editar recargo"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas eliminar el recargo para ${r.conceptoPago}?`)) {
                            updateRecargoMutation.mutate({
                              id: r.id,
                              activo: false
                            });
                          }
                        }}
                        className="p-1.5 text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Eliminar recargo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-xs py-4 border-2 border-dashed border-gray-100 rounded-xl mt-2">
                No hay recargos personalizados configurados.
              </div>
            )}
          </div>

          {/* Modal de Recargo */}
          {modalRecargoOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-navy-800">
                  {recargoEditando ? 'Editar Recargo' : 'Añadir Recargo Específico'}
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Concepto de Pago</label>
                    <select
                      className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-navy-500"
                      value={recargoForm.concepto}
                      onChange={(e) => setRecargoForm({ ...recargoForm, concepto: e.target.value })}
                      disabled={!!recargoEditando}
                    >
                      {['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'LIBROS', 'UNIFORME', 'COLEGIATURA'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="chkLlevaRecargo"
                      checked={recargoForm.llevaRecargo}
                      onChange={(e) => setRecargoForm({ ...recargoForm, llevaRecargo: e.target.checked })}
                      className="w-4 h-4 text-navy-600 rounded border-gray-300 focus:ring-navy-500"
                    />
                    <label htmlFor="chkLlevaRecargo" className="text-sm text-gray-700 cursor-pointer font-medium">Lleva recargo económico</label>
                  </div>

                  {recargoForm.llevaRecargo && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-gray-700">Monto del Recargo ($)</label>
                      <Input
                        type="number"
                        min="0"
                        value={recargoForm.monto}
                        onChange={(e) => setRecargoForm({ ...recargoForm, monto: e.target.value })}
                        className="bg-gray-50"
                        placeholder="Ej. 400"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Plazo (Días de gracia)</label>
                    <Input
                      type="number"
                      min="0"
                      value={recargoForm.diasGracia}
                      onChange={(e) => setRecargoForm({ ...recargoForm, diasGracia: e.target.value })}
                      className="bg-gray-50"
                      placeholder="Ej. 5"
                    />
                    <p className="text-[10px] text-gray-500 leading-tight">Días naturales permitidos a partir de la fecha de vencimiento antes de aplicar la penalización o vencer el plazo.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="text-xs py-1.5" onClick={() => setModalRecargoOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" className="text-xs py-1.5" onClick={handleSaveRecargoForm}>
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          )}
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
  );
}
