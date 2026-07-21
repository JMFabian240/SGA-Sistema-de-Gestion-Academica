import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Plus, Trash2, Calendar, Percent, Tag, Edit2, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function PromocionesPanel() {
  // Queries
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const { data: niveles } = trpc.grupos.getNiveles.useQuery();
  const { data: grados } = trpc.grupos.getGrados.useQuery();
  
  const [cicloId, setCicloId] = useState('');
  const { data: grupos } = trpc.grupos.getGrupos.useQuery({ cicloId: Number(cicloId) }, { enabled: !!cicloId });

  const { data: ventanas, refetch: refetchVentanas } = trpc.inscripciones.getVentanas.useQuery();
  const { data: becas, refetch: refetchBecas } = trpc.becas.getBecas.useQuery();

  // Mutations
  const createVentana = trpc.inscripciones.createVentana.useMutation({
    onSuccess: () => {
      refetchVentanas();
      refetchBecas();
    }
  });
  const updateVentana = trpc.inscripciones.updateVentana.useMutation({
    onSuccess: () => refetchVentanas(),
    onError: (err: any) => alert(err.message || 'Error al actualizar ventana')
  });
  const deleteVentana = trpc.inscripciones.deleteVentana.useMutation({
    onSuccess: () => refetchVentanas()
  });

  const createBeca = trpc.becas.createBeca.useMutation({
    onSuccess: () => refetchBecas(),
    onError: (err: any) => alert(err.message || 'Error al crear beca')
  });
  const updateBeca = trpc.becas.updateBeca.useMutation({
    onSuccess: () => refetchBecas(),
    onError: (err: any) => alert(err.message || 'Error al actualizar beca')
  });
  const deleteBeca = trpc.becas.deleteBeca.useMutation({
    onSuccess: () => refetchBecas(),
    onError: (err: any) => alert(err.message || 'Error al eliminar beca')
  });

  // State: Ventana
  const [editingVentanaId, setEditingVentanaId] = useState<number | null>(null);
  const [becaIdVentana, setBecaIdVentana] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Nuevos campos
  const [nivelId, setNivelId] = useState('');
  const [gradoId, setGradoId] = useState('');
  const [descuentoInscripcion, setDescuentoInscripcion] = useState('');
  
  // Selección múltiple de grupos
  const [gruposIds, setGruposIds] = useState<number[]>([]);
  const [selectedGrupoIdToAdd, setSelectedGrupoIdToAdd] = useState('');

  // State: Beca
  const [editingBecaId, setEditingBecaId] = useState<number | null>(null);
  const [nombreBeca, setNombreBeca] = useState('');
  const [criterio, setCriterio] = useState('ACADEMICA');
  const [porcentajeBeca, setPorcentajeBeca] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleAddGrupo = () => {
    if (!selectedGrupoIdToAdd) return;
    const gId = Number(selectedGrupoIdToAdd);
    if (!gruposIds.includes(gId)) {
      setGruposIds(prev => [...prev, gId]);
    }
    setSelectedGrupoIdToAdd('');
  };

  const handleRemoveGrupo = (gId: number) => {
    setGruposIds(prev => prev.filter(id => id !== gId));
  };

  const handleCreateVentana = () => {
    if (!cicloId || !becaIdVentana || !fechaInicio || !fechaFin) {
      alert('Llena todos los campos obligatorios (Ciclo, Beca Asociada, Fechas)');
      return;
    }
    const payload = {
      cicloId: Number(cicloId),
      becaId: Number(becaIdVentana),
      fechaInicio: new Date(fechaInicio + 'T12:00:00').toISOString(),
      fechaFin: new Date(fechaFin + 'T12:00:00').toISOString(),
      activa: true,
      nivelId: nivelId ? Number(nivelId) : null,
      gradoId: gradoId ? Number(gradoId) : null,
      descuentoInscripcion: descuentoInscripcion ? Number(descuentoInscripcion) : null,
      gruposIds: gruposIds.length > 0 ? gruposIds : undefined
    };
    if (editingVentanaId) {
      updateVentana.mutate({ ventanaId: editingVentanaId, ...payload });
      setEditingVentanaId(null);
    } else {
      createVentana.mutate(payload);
    }
    resetVentanaForm();
  };

  const handleEditVentana = (v: any) => {
    setEditingVentanaId(v.ventanaId);
    setCicloId(v.cicloId.toString());
    setBecaIdVentana(v.becaId?.toString() || '');
    setFechaInicio(v.fechaInicio.split('T')[0]);
    setFechaFin(v.fechaFin.split('T')[0]);
    setNivelId(v.nivelId?.toString() || '');
    setGradoId(v.gradoId?.toString() || '');
    setDescuentoInscripcion(v.descuentoInscripcion?.toString() || '');
    setGruposIds(v.ventanasGrupo?.map((vg: any) => vg.grupoId) || []);
  };

  const cancelEditVentana = () => {
    setEditingVentanaId(null);
    resetVentanaForm();
  };

  const resetVentanaForm = () => {
    setCicloId('');
    setBecaIdVentana('');
    setFechaInicio('');
    setFechaFin('');
    setNivelId('');
    setGradoId('');
    setDescuentoInscripcion('');
    setGruposIds([]);
    setSelectedGrupoIdToAdd('');
  };

  const handleCreateBeca = () => {
    if (!nombreBeca || !criterio || !porcentajeBeca) {
      alert('Llena los campos obligatorios');
      return;
    }
    const payload = {
      nombreBeca,
      criterio: criterio as any,
      porcentaje: Number(porcentajeBeca),
      descripcion
    };
    if (editingBecaId) {
      updateBeca.mutate({ becaId: editingBecaId, ...payload });
      setEditingBecaId(null);
    } else {
      createBeca.mutate(payload);
    }
    setNombreBeca('');
    setPorcentajeBeca('');
    setDescripcion('');
  };

  const handleEditBeca = (b: any) => {
    setEditingBecaId(b.becaId);
    setNombreBeca(b.nombreBeca);
    setCriterio(b.criterio);
    setPorcentajeBeca(b.porcentaje.toString());
    setDescripcion(b.descripcion || '');
  };

  const cancelEditBeca = () => {
    setEditingBecaId(null);
    setNombreBeca('');
    setPorcentajeBeca('');
    setDescripcion('');
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">

      {/* 1. Catálogo Global de Becas */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Tag className="text-blue-600" />
          Catálogo Global de Becas y Promociones
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Crea becas generales que podrás asignar manualmente a cualquier alumno desde su expediente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
          <div>
            <label className="block text-sm text-slate-700 font-medium mb-1">Nombre</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={nombreBeca}
              onChange={e => setNombreBeca(e.target.value)}
              placeholder="Ej. Beca Talento Primaria"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 font-medium mb-1">Criterio</label>
            <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={criterio} onChange={e => setCriterio(e.target.value)}>
              <option value="ACADEMICA">Académica</option>
              <option value="SOCIOECONOMICA">Socioeconómica</option>
              <option value="DEPORTIVA">Deportiva</option>
              <option value="CULTURAL">Cultural</option>
              <option value="POR_HERMANOS">Por Hermanos</option>
              <option value="PROMOCION_TEMPRANA">Promoción Temprana</option>
              <option value="EXTERNA">Externa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700 font-medium mb-1">Descuento (%)</label>
            <input
              type="number"
              min="0" max="100"
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={porcentajeBeca}
              onChange={e => setPorcentajeBeca(e.target.value)}
              placeholder="Ej. 20"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 font-medium mb-1">Descripción</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-2 mt-2">
            {editingBecaId && (
              <Button onClick={cancelEditBeca} variant="outline" className="flex items-center gap-2">
                <X size={16} /> Cancelar
              </Button>
            )}
            <Button onClick={handleCreateBeca} disabled={createBeca.isPending || updateBeca.isPending} className="flex items-center gap-2">
              {editingBecaId ? <><Edit2 size={16} /> Guardar Cambios</> : <><Plus size={16} /> Crear Beca</>}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {becas?.map((b: any) => (
            <div key={b.becaId} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors gap-4">
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                  {b.nombreBeca}
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wide">{b.criterio}</span>
                </p>
                <p className="text-sm text-slate-600 font-medium mt-2 flex items-center gap-1.5">
                  <Percent size={14} className="text-emerald-600" />
                  {b.porcentaje}% de Descuento
                </p>
                {b.descripcion && <p className="text-xs text-slate-500 mt-2">{b.descripcion}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditBeca(b)}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                  title="Editar Beca"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => { if (window.confirm(`¿Seguro que deseas eliminar la beca ${b.nombreBeca}?`)) deleteBeca.mutate(b.becaId); }}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Eliminar Beca"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {becas?.length === 0 && (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No hay becas registradas.
            </div>
          )}
        </div>
      </div>

      {/* 2. Ventanas de Inscripción (Automáticas) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Reglas de Inscripción Temprana (Automáticas)
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Configura ventanas de tiempo donde las inscripciones obtendrán un descuento automático según su nivel educativo.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-700 font-medium mb-1">Ciclo *</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={cicloId} onChange={e => setCicloId(e.target.value)}>
                <option value="">Selecciona...</option>
                {ciclos?.map((c: any) => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 font-medium mb-1">Beca Asociada (Colegiatura) *</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={becaIdVentana} onChange={e => setBecaIdVentana(e.target.value)}>
                <option value="">Selecciona...</option>
                {becas?.map((b: any) => <option key={b.becaId} value={b.becaId}>{b.nombreBeca} ({b.porcentaje}%)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 font-medium mb-1">Vigencia Inicio *</label>
              <input type="date" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-700 font-medium mb-1">Vigencia Fin *</label>
              <input type="date" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </div>
            
            {/* Nuevos campos de filtrado y descuento */}
            <div>
              <label className="block text-sm text-slate-700 font-medium mb-1">Nivel Educativo</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={nivelId} onChange={e => setNivelId(e.target.value)}>
                <option value="">Todos los niveles</option>
                {niveles?.map((n: any) => <option key={n.nivelId} value={n.nivelId}>{n.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 font-medium mb-1">Grado</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={gradoId} onChange={e => setGradoId(e.target.value)}>
                <option value="">Todos los grados</option>
                {grados?.filter((g: any) => !nivelId || g.nivelId.toString() === nivelId).map((g: any) => (
                  <option key={g.gradoId} value={g.gradoId}>{g.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 font-medium mb-1">% Descuento Inscripción</label>
              <input
                type="number" min="0" max="100"
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={descuentoInscripcion} onChange={e => setDescuentoInscripcion(e.target.value)}
                placeholder="Ej. 100"
              />
            </div>
          </div>
          
          <div className="mt-4 border-t pt-4 border-slate-200">
            <label className="block text-sm text-slate-700 font-medium mb-1">Restringir a Grupos Específicos (Opcional)</label>
            <div className="flex gap-2 mb-3">
              <select
                className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedGrupoIdToAdd}
                onChange={e => setSelectedGrupoIdToAdd(e.target.value)}
                disabled={!cicloId}
              >
                <option value="">{cicloId ? 'Selecciona un grupo para añadir...' : 'Selecciona un ciclo primero'}</option>
                {grupos?.filter((g: any) => !gruposIds.includes(g.grupoId)).map((g: any) => (
                  <option key={g.grupoId} value={g.grupoId}>
                    {g.grado?.nombre} {g.nombre} ({g.nivel?.nombre})
                  </option>
                ))}
              </select>
              <Button onClick={handleAddGrupo} disabled={!selectedGrupoIdToAdd} variant="outline" type="button">
                Agregar
              </Button>
            </div>
            
            {gruposIds.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {gruposIds.map(gId => {
                  const grupo = grupos?.find((g: any) => g.grupoId === gId);
                  return (
                    <div key={gId} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                      <span>{grupo ? `${grupo.grado?.nombre} ${grupo.nombre}` : `ID: ${gId}`}</span>
                      <button onClick={() => handleRemoveGrupo(gId)} className="hover:text-red-500 transition-colors" title="Remover">
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
            {editingVentanaId && (
              <Button onClick={cancelEditVentana} variant="outline" className="flex items-center gap-2">
                <X size={16} /> Cancelar
              </Button>
            )}
            <Button onClick={handleCreateVentana} disabled={createVentana.isPending || updateVentana.isPending} className="flex items-center gap-2">
              {editingVentanaId ? <><Edit2 size={16} /> Guardar Cambios</> : <><Plus size={16} /> Agregar Promoción</>}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {ventanas?.map((v: any) => (
            <div key={v.ventanaId} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors gap-4">
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  <Percent size={14} className="text-emerald-600" />
                  {v.beca ? `${v.beca.porcentaje}% Beca Colegiatura` : 'Sin beca asignada'}
                  {v.descuentoInscripcion && (
                    <span className="ml-2 text-indigo-600 flex items-center gap-1">
                      <Percent size={14} /> {v.descuentoInscripcion}% Inscripción
                    </span>
                  )}
                </p>
                <div className="flex gap-2 text-sm text-slate-600 font-medium mt-2 flex-wrap items-center">
                  <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">Ciclo: {v.ciclo?.nombre}</span>
                  {v.nivel && <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">Nivel: {v.nivel.nombre}</span>}
                  {v.grado && <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">Grado: {v.grado.nombre}</span>}
                  
                  {v.ventanasGrupo?.length > 0 && (
                    <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                      Grupos: {v.ventanasGrupo.map((vg: any) => `${vg.grupo?.grado?.nombre || ''} ${vg.grupo?.nombre || ''}`).join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Válido del {new Date(v.fechaInicio).toLocaleDateString('es-MX', { timeZone: 'UTC' })} al {new Date(v.fechaFin).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditVentana(v)}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                  title="Editar Ventana"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => { if (window.confirm('¿Eliminar esta regla automática?')) deleteVentana.mutate(v.ventanaId); }}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Eliminar Ventana"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {ventanas?.length === 0 && (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No hay ventanas promocionales configuradas.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
