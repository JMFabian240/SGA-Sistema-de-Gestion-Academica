import { useState } from 'react';
import { X, Calculator, Save } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

interface AsignarPlanPagoModalProps {
  inscripcionId: number;
  alumnoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AsignarPlanPagoModal({ inscripcionId, alumnoId, isOpen, onClose }: AsignarPlanPagoModalProps) {
  const utils = trpc.useUtils();
  const [planPagoId, setPlanPagoId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: planes } = trpc.inscripciones.getPlanesPago.useQuery();
  const { data: tarifaBase = 0 } = trpc.inscripciones.getTarifaColegiatura.useQuery(
    { inscripcionId },
    { enabled: isOpen }
  );

  const asignarMutation = trpc.inscripciones.asignarPlanPago.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      window.alert('Plan de pago asignado. Calendario generado correctamente.');
      utils.alumnos.getById.invalidate(alumnoId);
      onClose();
    },
    onError: (err) => {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Error al asignar el plan.');
    }
  });

  if (!isOpen) return null;

  const planSeleccionado = planes?.find(p => p.planPagoId === Number(planPagoId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!planPagoId) {
      setErrorMsg('Debes seleccionar un plan de pagos.');
      return;
    }

    setIsSubmitting(true);
    asignarMutation.mutate({
      inscripcionId,
      planPagoId: Number(planPagoId)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Asignar Plan de Pagos</h3>
            <p className="text-sm text-gray-500 mt-1">Se generarán los recibos de colegiatura automáticamente</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calculator size={16} className="text-emerald-600" />
              Selecciona el esquema de pagos (Colegiaturas)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {planes?.filter(p => !p.eliminadoEn).map(plan => {
                const pagoMensual = tarifaBase / plan.meses;
                
                return (
                  <div 
                    key={plan.planPagoId}
                    onClick={() => setPlanPagoId(String(plan.planPagoId))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      planPagoId === String(plan.planPagoId) 
                        ? 'border-emerald-500 bg-emerald-50/50' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-gray-800">{plan.nombre}</div>
                    <div className="text-xs text-gray-500 mt-1">{plan.meses} mensualidades de ${pagoMensual.toLocaleString('en-US')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {planSeleccionado && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h4 className="text-sm font-bold text-emerald-900 mb-2">Simulación del Calendario</h4>
              <p className="text-xs text-emerald-700 mb-2">
                Se generarán <b>{planSeleccionado.meses} recibos</b> de colegiatura automáticamente. 
              </p>
              <div className="text-xs text-emerald-800 bg-white/50 p-2 rounded flex justify-between border border-emerald-100/50 mt-2">
                <span>Costo Total Anual:</span>
                <span className="font-bold">${(tarifaBase).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !planPagoId}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {isSubmitting ? 'Procesando...' : 'Asignar Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
