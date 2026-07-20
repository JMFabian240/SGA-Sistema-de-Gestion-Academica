import { useState } from 'react';
import { X, Save, PlusCircle } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

interface NuevoCargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumnoId: number;
  cicloId: number;
}

export function NuevoCargoModal({ isOpen, onClose, alumnoId, cicloId }: NuevoCargoModalProps) {
  const utils = trpc.useUtils();
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState(
    new Date().toISOString().split('T')[0] // Hoy por defecto
  );
  
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = trpc.pagos.createCargoExtraordinario.useMutation({
    onSuccess: () => {
      utils.pagos.getAdeudos.invalidate({ alumnoId });
      onClose();
      // Limpiar formulario para la próxima vez
      setConcepto('');
      setMonto('');
      setErrorMsg('');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Error al generar el cargo');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!concepto || isNaN(montoNum) || montoNum <= 0 || !fechaVencimiento) {
      setErrorMsg('Todos los campos son obligatorios y el monto debe ser mayor a 0.');
      return;
    }

    createMutation.mutate({
      alumnoId,
      cicloId,
      concepto,
      monto: Number(monto),
      fechaVencimiento: new Date(fechaVencimiento).toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <PlusCircle className="text-blue-600" />
              Cargo Extraordinario
            </h3>
            <p className="text-sm text-gray-500 mt-1">Genera un nuevo adeudo al alumno</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Concepto</label>
            <input 
              type="text" 
              placeholder="Ej. Libro de Inglés, Uniforme, Recargo..." 
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Monto ($)</label>
              <input 
                type="text" 
                placeholder="Ej. 1500 o 1500.00"
                value={monto}
                onChange={(e) => {
                  let val = e.target.value;
                  // Remover cualquier caracter que no sea numero o punto
                  val = val.replace(/[^0-9.]/g, '');
                  // Evitar mas de un punto decimal
                  const parts = val.split('.');
                  if (parts.length > 2) {
                    val = parts[0] + '.' + parts.slice(1).join('');
                  }
                  setMonto(val);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Límite</label>
              <input 
                type="date" 
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {createMutation.isPending ? 'Generando...' : 'Generar Cargo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
