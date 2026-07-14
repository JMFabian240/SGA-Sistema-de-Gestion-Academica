import { useState, useEffect } from 'react';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cicloId: number;
};

export function InicializarGruposModal({ isOpen, onClose, cicloId }: Props) {
  const utils = trpc.useUtils();

  const { data: gradosDisponibles, isLoading } = trpc.grupos.getGradosParaInicializar.useQuery(
    { cicloId },
    { enabled: isOpen && !!cicloId }
  );

  const [selectedGrados, setSelectedGrados] = useState<Record<number, boolean>>({});
  const [customNames, setCustomNames] = useState<Record<number, string>>({});
  const [customCapacities, setCustomCapacities] = useState<Record<number, number>>({});

  useEffect(() => {
    if (gradosDisponibles) {
      const sel: Record<number, boolean> = {};
      const names: Record<number, string> = {};
      const caps: Record<number, number> = {};
      gradosDisponibles.forEach(g => {
        sel[g.gradoId] = true; // Select all by default
        names[g.gradoId] = g.nombrePropuesto;
        caps[g.gradoId] = 30;
      });
      setSelectedGrados(sel);
      setCustomNames(names);
      setCustomCapacities(caps);
    }
  }, [gradosDisponibles]);

  const toggleSelect = (gradoId: number) => {
    setSelectedGrados(prev => ({ ...prev, [gradoId]: !prev[gradoId] }));
  };

  const handleNameChange = (gradoId: number, value: string) => {
    setCustomNames(prev => ({ ...prev, [gradoId]: value }));
  };

  const handleCapacityChange = (gradoId: number, value: number) => {
    setCustomCapacities(prev => ({ ...prev, [gradoId]: value }));
  };

  const initMutation = trpc.grupos.inicializarGruposSeleccionados.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedList = Object.keys(selectedGrados)
      .map(Number)
      .filter(id => selectedGrados[id]);

    if (selectedList.length === 0) {
      alert('Debes seleccionar al menos un grupo para inicializar.');
      return;
    }

    const payload = {
      cicloId,
      grupos: selectedList.map(id => ({
        gradoId: id,
        nombre: customNames[id]?.trim() || '',
        cupoMaximo: customCapacities[id] || 30
      }))
    };

    // Validar que todos los nombres seleccionados estén rellenados
    const tieneNombreVacio = payload.grupos.some(g => !g.nombre);
    if (tieneNombreVacio) {
      alert('Todos los grupos seleccionados deben tener un nombre asignado.');
      return;
    }

    initMutation.mutate(payload);
  };

  const isSaving = initMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inicializar Grupos del Ciclo"
      size="lg"
    >
      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Cargando grados disponibles...</div>
      ) : !gradosDisponibles || gradosDisponibles.length === 0 ? (
        <div className="py-6 text-center space-y-4">
          <p className="text-gray-500">No hay grados permitidos pendientes de inicializar para este ciclo.</p>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            A continuación se listan los grados permitidos en este ciclo que aún no tienen grupos. Selecciona cuáles deseas inicializar y personaliza sus parámetros:
          </p>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-3 w-12 text-center">
                    <input 
                      type="checkbox"
                      checked={Object.values(selectedGrados).every(Boolean)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newSel: Record<number, boolean> = {};
                        gradosDisponibles.forEach(g => {
                          newSel[g.gradoId] = checked;
                        });
                        setSelectedGrados(newSel);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-3">Grado</th>
                  <th className="p-3">Nivel</th>
                  <th className="p-3">Nombre del Grupo</th>
                  <th className="p-3">Cupo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {gradosDisponibles.map(grado => {
                  const isChecked = !!selectedGrados[grado.gradoId];
                  return (
                    <tr key={grado.gradoId} className={`hover:bg-gray-50/50 ${isChecked ? '' : 'opacity-60'}`}>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(grado.gradoId)}
                          disabled={isSaving}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-900">{grado.nombreGrado}</td>
                      <td className="p-3 text-gray-500">{grado.nombreNivel}</td>
                      <td className="p-3">
                        <input 
                          type="text"
                          value={customNames[grado.gradoId] ?? ''}
                          onChange={(e) => handleNameChange(grado.gradoId, e.target.value)}
                          disabled={!isChecked || isSaving}
                          className="px-2 py-1 w-24 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3">
                        <input 
                          type="number"
                          value={customCapacities[grado.gradoId] ?? 30}
                          onChange={(e) => handleCapacityChange(grado.gradoId, parseInt(e.target.value, 10))}
                          disabled={!isChecked || isSaving}
                          className="px-2 py-1 w-16 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Inicializar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
