import { useEffect, useState } from 'react';
import { X, Loader2, Award } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onActualizado: () => void;
  asignacion: any | null;
}

export function EditarAsignacionModal({ isOpen, onClose, onActualizado, asignacion }: Props) {
  const [becaId, setBecaId] = useState<number | ''>('');
  const [cicloId, setCicloId] = useState<number | ''>('');

  const { data: becas, isLoading: loadingBecas } = trpc.becas.getBecas.useQuery(undefined, { enabled: isOpen });
  const { data: ciclos, isLoading: loadingCiclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  
  const updateMutation = trpc.becas.updateAsignacion.useMutation({
    onSuccess: () => {
      toast.success('Beca actualizada exitosamente.');
      onActualizado();
      onClose();
    },
    onError: (err) => toast.error(err.message)
  });

  useEffect(() => {
    if (isOpen && asignacion) {
      setBecaId(asignacion.becaId);
      setCicloId(asignacion.cicloId);
    }
  }, [isOpen, asignacion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!becaId || !cicloId || !asignacion) return;

    updateMutation.mutate({
      asignacionId: asignacion.asignacionId,
      becaId: Number(becaId),
      cicloId: Number(cicloId)
    });
  };

  if (!isOpen || !asignacion) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Editar Beca Asignada</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Alumno
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-sm">
              {asignacion.alumno?.nombreCompleto}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tipo de Beca
            </label>
            <select
              value={becaId}
              onChange={(e) => setBecaId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loadingBecas}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
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
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
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
              disabled={updateMutation.isPending || !becaId || !cicloId}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#001429] text-white rounded-xl text-sm font-semibold hover:bg-[#001f3f] transition-colors disabled:opacity-70"
            >
              {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
