import { useEffect, useState } from 'react';
import { X, Loader2, Award, Search } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAsignado: () => void;
}

export function BuscadorAsignarBecaModal({ isOpen, onClose, onAsignado }: Props) {
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [becaId, setBecaId] = useState<number | ''>('');
  const [cicloId, setCicloId] = useState<number | ''>('');

  const { data: alumnos } = trpc.alumnos.getAll.useQuery(undefined, { enabled: isOpen });
  const { data: becas, isLoading: loadingBecas } = trpc.becas.getBecas.useQuery(undefined, { enabled: isOpen });
  const { data: ciclos, isLoading: loadingCiclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  
  const assignMutation = trpc.becas.assignBeca.useMutation({
    onSuccess: () => {
      toast.success('Beca asignada exitosamente al alumno.');
      onAsignado();
      onClose();
    },
    onError: (err) => toast.error(err.message)
  });

  useEffect(() => {
    if (isOpen) {
      setAlumnoSeleccionado(null);
      setBusquedaAlumno('');
      setBecaId('');
      if (ciclos) {
        const cicloActivo = ciclos.find((c: any) => c.activo);
        setCicloId(cicloActivo ? cicloActivo.cicloId : '');
      }
    }
  }, [isOpen, ciclos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoSeleccionado || !becaId || !cicloId) {
      toast.error('Selecciona un alumno, una beca y el ciclo escolar.');
      return;
    }

    assignMutation.mutate({
      alumnoId: alumnoSeleccionado.alumnoId,
      becaId: Number(becaId),
      cicloId: Number(cicloId),
      fechaAsignacion: new Date().toISOString()
    });
  };

  const alumnosFiltrados = busquedaAlumno.length >= 2 
    ? alumnos?.filter((a: any) => a.nombreCompleto.toLowerCase().includes(busquedaAlumno.toLowerCase()))
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Asignar Beca a Alumno</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!alumnoSeleccionado ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Buscar Alumno
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nombre del alumno..."
                  value={busquedaAlumno}
                  onChange={(e) => setBusquedaAlumno(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              
              {busquedaAlumno.length >= 2 && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-slate-100 rounded-xl shadow-sm">
                  {alumnosFiltrados?.map((a: any) => (
                    <div 
                      key={a.alumnoId}
                      onClick={() => setAlumnoSeleccionado(a)}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <div className="font-medium text-slate-800 text-sm">{a.nombreCompleto}</div>
                      <div className="text-xs text-slate-500">{a.nivel?.nombre} - {a.grado?.nombre}</div>
                    </div>
                  ))}
                  {alumnosFiltrados?.length === 0 && (
                    <div className="p-3 text-sm text-slate-500 text-center">No se encontraron resultados</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Alumno Seleccionado
              </label>
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <div className="font-medium text-blue-900 text-sm">{alumnoSeleccionado.nombreCompleto}</div>
                  <div className="text-xs text-blue-700/70">{alumnoSeleccionado.nivel?.nombre} - {alumnoSeleccionado.grado?.nombre}</div>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setAlumnoSeleccionado(null); setBusquedaAlumno(''); }}
                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1"
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tipo de Beca
            </label>
            <select
              value={becaId}
              onChange={(e) => setBecaId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loadingBecas}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">Selecciona una beca del catálogo...</option>
              {becas?.map((b: any) => (
                <option key={b.becaId} value={b.becaId}>
                  {b.nombreBeca} - {Number(b.porcentaje)}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ciclo Escolar
            </label>
            <select
              value={cicloId}
              onChange={(e) => setCicloId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loadingCiclos}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">Selecciona un ciclo...</option>
              {ciclos?.map((c: any) => (
                <option key={c.cicloId} value={c.cicloId}>
                  {c.nombre} {c.activo ? '(Activo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending || !alumnoSeleccionado || !becaId || !cicloId}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#001429] text-white rounded-xl text-sm font-semibold hover:bg-[#001f3f] transition-colors disabled:opacity-70"
            >
              {assignMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Asignar Beca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
