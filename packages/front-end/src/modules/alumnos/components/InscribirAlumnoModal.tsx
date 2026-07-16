import { useState, useEffect } from 'react';
import { X, BookOpen, Save, Layers, GraduationCap } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

interface InscribirAlumnoModalProps {
  alumnoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function InscribirAlumnoModal({ alumnoId, isOpen, onClose }: InscribirAlumnoModalProps) {
  const utils = trpc.useUtils();

  const [nivelId, setNivelId] = useState('');
  const [gradoId, setGradoId] = useState('');
  const [grupoId, setGrupoId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: grupos } = trpc.grupos.getGrupos.useQuery(undefined, { enabled: isOpen });
  const { data: niveles } = trpc.grupos.getNiveles.useQuery(undefined, { enabled: isOpen });
  const { data: grados } = trpc.grupos.getGrados.useQuery(undefined, { enabled: isOpen });

  // Obtener todos los ciclos activos (por ejemplo, Semestral y Anual a la vez)
  const ciclosActivos = ciclos?.filter((c: any) => c.activo && !c.eliminadoEn) || [];
  const activoCicloIds = ciclosActivos.map((c: any) => c.cicloId);

  const createMutation = trpc.inscripciones.createInscripcion.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      window.alert('Inscripción realizada. Calendario de pagos generado.');
      utils.alumnos.getById.invalidate(alumnoId);
      onClose();
    },
    onError: (err) => {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Error al inscribir alumno');
    }
  });

  // Limpiar form al cerrar
  useEffect(() => {
    if (!isOpen) {
      setNivelId('');
      setGradoId('');
      setGrupoId('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nivelesFiltrados = niveles?.filter((n: any) => 
    grupos?.some((g: any) => g.nivelId === n.nivelId && !g.eliminadoEn && !g.cerrado && activoCicloIds.includes(g.cicloId))
  );

  const gradosFiltrados = grados?.filter((g: any) => g.nivelId.toString() === nivelId) || [];

  // Filtrar grupos activos que pertenezcan a CUALQUIER ciclo activo, del nivel y grado seleccionados
  const gruposDisponibles = grupos?.filter((g: any) =>
    !g.eliminadoEn &&
    !g.cerrado &&
    activoCicloIds.includes(g.cicloId) &&
    g.nivelId.toString() === nivelId &&
    g.gradoId.toString() === gradoId
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!nivelId || !gradoId || !grupoId) {
      setErrorMsg('Completa todos los campos obligatorios');
      return;
    }

    const grupoSeleccionado = grupos?.find((g: any) => g.grupoId.toString() === grupoId);
    if (!grupoSeleccionado) {
      setErrorMsg('Grupo inválido');
      return;
    }

    setIsSubmitting(true);
    createMutation.mutate({
      alumnoId,
      cicloId: grupoSeleccionado.cicloId,
      grupoId: Number(grupoId),
      fechaIngreso: new Date().toISOString(),
      estadoEnCiclo: 'INSCRITO',
      estadoFinanciero: 'NO_APLICA'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Inscripción a Ciclo Escolar</h3>
            <p className="text-sm text-gray-500 mt-1">Generación automática de calendario de pagos</p>
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {ciclosActivos.length === 0 && ciclos && ciclos.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm rounded-xl">
              No hay un ciclo escolar activo actualmente. No puedes realizar inscripciones.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Layers size={16} className="text-blue-500" />
                Nivel Educativo
              </label>
              <select
                value={nivelId}
                onChange={(e) => {
                  setNivelId(e.target.value);
                  setGradoId('');
                  setGrupoId('');
                }}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                required
              >
                <option value="">Selecciona el nivel</option>
                {nivelesFiltrados?.map((n: any) => (
                  <option key={n.nivelId} value={n.nivelId.toString()}>{n.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <GraduationCap size={16} className="text-blue-500" />
                Grado
              </label>
              <select
                value={gradoId}
                onChange={(e) => {
                  setGradoId(e.target.value);
                  setGrupoId('');
                }}
                disabled={!nivelId}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm disabled:opacity-50"
                required
              >
                <option value="">Selecciona el grado</option>
                {gradosFiltrados?.map((g: any) => (
                  <option key={g.gradoId} value={g.gradoId.toString()}>{g.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-blue-500" />
                Grupo Académico
              </label>
              <select
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                disabled={!gradoId}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm disabled:opacity-50"
                required
              >
                <option value="">Selecciona el grupo</option>
                {gruposDisponibles?.map((g: any) => (
                  <option key={g.grupoId} value={g.grupoId}>{g.nombre} (Cupo: {g.cupoMaximo})</option>
                ))}
              </select>
            </div>
          </div>

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
              disabled={isSubmitting || !grupoId || !nivelId || !gradoId}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {isSubmitting ? 'Procesando...' : 'Guardar Inscripción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
