import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { trpc } from '../../../lib/trpc';
import { ArrowRight, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cicloActual: any;
  onOpenNewCiclo?: () => void;
  onContinueToInscripcion: (cicloDestinoId: number) => void;
};

export function TransicionCicloWizard({ isOpen, onClose, cicloActual, onOpenNewCiclo, onContinueToInscripcion }: Props) {
  const [cicloDestinoId, setCicloDestinoId] = useState<number | ''>('');
  
  const utils = trpc.useContext();
  
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });

  const transicionMutation = trpc.grupos.transicionCiclo.useMutation({
    onSuccess: () => {
      utils.grupos.getCiclos.invalidate();
      utils.inscripciones.getInscripciones.invalidate();
      onClose();
    },
    onError: (err) => {
      alert(err.message);
    }
  });


  const ciclosDisponibles = ciclos?.filter(c => c.cicloId !== cicloActual?.cicloId) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Transición de Ciclo: ${cicloActual?.nombre}`} size="lg">
      <div className="space-y-6">
        
        {/* Steps Info */}
        <div className="flex items-center gap-4 text-sm font-medium mb-6">
          <div className="flex items-center gap-2 text-navy-700">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white bg-navy-600">1</div>
            Ciclo Destino
          </div>
        </div>

        <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong>Atención:</strong> Esta acción cerrará definitivamente el ciclo <strong>{cicloActual?.nombre}</strong>. Los expedientes, calificaciones y colegiaturas pasarán a ser de solo lectura. Asegúrate de que todos los grupos estén cerrados.
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecciona el Ciclo Escolar Destino
              </label>
              <select
                value={cicloDestinoId}
                onChange={(e) => setCicloDestinoId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 outline-none text-sm bg-white"
              >
                <option value="">-- Selecciona un ciclo --</option>
                {ciclosDisponibles.map(c => (
                  <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>
                ))}
              </select>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  El ciclo destino debe estar vacío (sin alumnos inscritos).
                </p>
                {onOpenNewCiclo && (
                  <button
                    type="button"
                    onClick={onOpenNewCiclo}
                    className="flex items-center gap-2 px-3 py-1.5 bg-navy-600 hover:bg-navy-700 text-white font-medium rounded-lg transition-colors shadow-sm text-xs"
                  >
                    + Crear Nuevo Ciclo
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="button" 
                onClick={() => {
                  if (cicloDestinoId) onContinueToInscripcion(Number(cicloDestinoId));
                }} 
                disabled={cicloDestinoId === ''}
              >
                Continuar a Inscripción <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>

      </div>
    </Modal>
  );
}
