import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { trpc } from '../../../lib/trpc';
import { ArrowRight, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cicloActual: any;
};

export function TransicionCicloWizard({ isOpen, onClose, cicloActual }: Props) {
  const [step, setStep] = useState(1);
  const [cicloDestinoId, setCicloDestinoId] = useState<number | ''>('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Record<number, boolean>>({});
  const [mapeoGrupos, setMapeoGrupos] = useState<Record<number, number | ''>>({}); // grupoOrigenId -> grupoDestinoId
  
  const utils = trpc.useContext();
  
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: gruposActuales } = trpc.grupos.getGrupos.useQuery(
    cicloActual?.cicloId ? { cicloId: cicloActual.cicloId } : undefined, 
    { enabled: isOpen && !!cicloActual }
  );
  const { data: gruposDestino } = trpc.grupos.getGrupos.useQuery(
    cicloDestinoId !== '' ? { cicloId: cicloDestinoId } : undefined, 
    { enabled: isOpen && cicloDestinoId !== '' }
  );
  const { data: inscripciones } = trpc.inscripciones.getInscripciones.useQuery(cicloActual?.cicloId, { enabled: isOpen && !!cicloActual });

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

  const handleNextStep = () => {
    if (step === 1 && cicloDestinoId !== '') {
      // Initialize selected students to all checked
      const inicialSeleccionados: Record<number, boolean> = {};
      inscripciones?.forEach((ins: any) => {
        inicialSeleccionados[ins.alumnoId] = true;
      });
      setAlumnosSeleccionados(inicialSeleccionados);
      
      // Try to auto-map groups if names match
      const map: Record<number, number | ''> = {};
      gruposActuales?.forEach((ga: any) => {
        const matchingDestino = gruposDestino?.find((gd: any) => gd.nombre === ga.nombre);
        map[ga.grupoId] = matchingDestino ? matchingDestino.grupoId : '';
      });
      setMapeoGrupos(map);
      
      setStep(2);
    }
  };

  const handleSubmit = () => {
    const payloadAlumnos: Record<number, number[]> = {};
    
    // Build payload: { grupoDestinoId: [alumnoId1, alumnoId2] }
    inscripciones?.forEach((ins: any) => {
      if (alumnosSeleccionados[ins.alumnoId]) {
        const grupoDestinoId = mapeoGrupos[ins.grupoId];
        if (grupoDestinoId !== '' && grupoDestinoId !== undefined) {
          if (!payloadAlumnos[grupoDestinoId]) payloadAlumnos[grupoDestinoId] = [];
          payloadAlumnos[grupoDestinoId].push(ins.alumnoId);
        }
      }
    });

    transicionMutation.mutate({
      cicloActualId: cicloActual.cicloId,
      cicloDestinoId: Number(cicloDestinoId),
      alumnosPorGrupo: payloadAlumnos
    });
  };

  const toggleAlumno = (alumnoId: number) => {
    setAlumnosSeleccionados(prev => ({ ...prev, [alumnoId]: !prev[alumnoId] }));
  };

  const ciclosDisponibles = ciclos?.filter(c => c.cicloId !== cicloActual?.cicloId) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Transición de Ciclo: ${cicloActual?.nombre}`} size="lg">
      <div className="space-y-6">
        
        {/* Progress Bar */}
        <div className="flex items-center gap-4 text-sm font-medium mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-navy-700' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step >= 1 ? 'bg-navy-600' : 'bg-gray-300'}`}>1</div>
            Ciclo Destino
          </div>
          <ChevronRight size={16} className="text-gray-300" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-navy-700' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step >= 2 ? 'bg-navy-600' : 'bg-gray-300'}`}>2</div>
            Inscripción y Grupos
          </div>
        </div>

        {step === 1 && (
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
              <p className="text-xs text-gray-500 mt-2">
                El ciclo destino debe estar vacío (sin alumnos inscritos). Si no lo has creado, cancela este asistente y créalo primero usando la opción "Nuevo Ciclo".
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={handleNextStep} disabled={cicloDestinoId === ''}>
                Siguiente Paso <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-2">
              {gruposActuales?.map(grupoOrigen => {
                const alumnosDelGrupo = inscripciones?.filter((ins: any) => ins.grupoId === grupoOrigen.grupoId) || [];
                if (alumnosDelGrupo.length === 0) return null;

                return (
                  <div key={grupoOrigen.grupoId} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="font-semibold text-navy-800">
                        Grupo Origen: {grupoOrigen.nombre} ({grupoOrigen.nivel.nombre})
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">Mover alumnos a:</span>
                        <select
                          value={mapeoGrupos[grupoOrigen.grupoId] || ''}
                          onChange={(e) => setMapeoGrupos(prev => ({ ...prev, [grupoOrigen.grupoId]: e.target.value === '' ? '' : Number(e.target.value) }))}
                          className="px-2 py-1 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-navy-500 outline-none"
                        >
                          <option value="">-- Seleccionar grupo --</option>
                          {gruposDestino?.filter((gd: any) => gd.nivelId === grupoOrigen.nivelId).map((gd: any) => (
                            <option key={gd.grupoId} value={gd.grupoId}>{gd.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-white divide-y divide-gray-100">
                      {alumnosDelGrupo.map((ins: any) => (
                        <label key={ins.alumnoId} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2">
                          <input
                            type="checkbox"
                            checked={alumnosSeleccionados[ins.alumnoId] || false}
                            onChange={() => toggleAlumno(ins.alumnoId)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ins.alumno.apellidos}, {ins.alumno.nombres}</div>
                            <div className="text-xs text-gray-500">Matrícula: {ins.alumno.matricula}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {gruposActuales?.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No hay grupos ni alumnos en el ciclo actual.
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={transicionMutation.isLoading}>
                Atrás
              </Button>
              <Button type="button" onClick={handleSubmit} isLoading={transicionMutation.isLoading}>
                <CheckCircle2 size={16} className="mr-2" /> Completar Transición
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
