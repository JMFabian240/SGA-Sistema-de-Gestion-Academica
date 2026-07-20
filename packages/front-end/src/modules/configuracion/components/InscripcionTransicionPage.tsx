import { useState, useEffect, useMemo } from 'react';
import { trpc } from '../../../lib/trpc';
import { RefreshCw, ArrowLeft, Users, AlertTriangle, PlusCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { GrupoFormModal } from '../../grupos/components/GrupoFormModal';

type Props = {
  cicloOrigenId: number;
  cicloDestinoId: number;
  onBack: () => void;
};

export function InscripcionTransicionPage({ cicloOrigenId, cicloDestinoId, onBack }: Props) {
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Record<number, boolean>>({});

  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const cicloDestino = ciclos?.find((c: any) => c.cicloId === cicloDestinoId);
  const { data: gruposOrigen, isLoading: loadingGrupos } = trpc.grupos.getGrupos.useQuery({ cicloId: cicloOrigenId });
  const { data: gruposDestino } = trpc.grupos.getGrupos.useQuery({ cicloId: cicloDestinoId });

  const { data: grados } = trpc.grupos.getGrados.useQuery();
  const { data: niveles } = trpc.grupos.getNiveles.useQuery();
  const { data: inscripcionesOrigen } = trpc.inscripciones.getInscripciones.useQuery({ cicloId: cicloOrigenId });

  const utils = trpc.useContext();

  const inscribirMutation = trpc.grupos.inscribirAlumnosTransicion.useMutation({
    onSuccess: () => {
      utils.inscripciones.getInscripciones.invalidate();
      alert('Alumnos inscritos exitosamente.');
      setSelectedGrupoId(null);
    }
  });

  const grupoSeleccionado = gruposOrigen?.find((g: any) => g.grupoId === selectedGrupoId) as any;

  const alumnosCandidatos = useMemo(() => {
    return inscripcionesOrigen
      ?.filter((ins: any) => ins.grupoId === selectedGrupoId && ins.alumno.estado === 'TRANSICION_PENDIENTE')
      .map((ins: any) => ins.alumno) || [];
  }, [inscripcionesOrigen, selectedGrupoId]);

  useEffect(() => {
    if (selectedGrupoId && alumnosCandidatos.length > 0) {
      const initial: Record<number, boolean> = {};
      alumnosCandidatos.forEach((a: any) => initial[a.alumnoId] = true);
      setAlumnosSeleccionados(initial);
    }
  }, [selectedGrupoId, alumnosCandidatos]);

  const gradoActual = grupoSeleccionado?.grado;
  const nivelActual = grupoSeleccionado?.nivel;

  let gradoSiguienteInfo: any = null;
  let grupoSugerido: any = null;

  let esEgresoDefinitivo = false;

  if (gradoActual && nivelActual && grados && niveles) {
    const numeroSiguiente = gradoActual.numero + 1;
    gradoSiguienteInfo = grados.find((g: any) => g.nivelId === nivelActual.nivelId && g.numero === numeroSiguiente);
    
    // Si no hay siguiente grado en este nivel, buscar el siguiente nivel por orden
    if (!gradoSiguienteInfo) {
      if (nivelActual.codigo === 'BAC') {
        esEgresoDefinitivo = true;
      } else {
        const siguienteNivel = niveles.find((n: any) => n.orden === nivelActual.orden + 1);
        if (siguienteNivel) {
          gradoSiguienteInfo = grados.find((g: any) => g.nivelId === siguienteNivel.nivelId && g.numero === 1);
        }
      }
    }

    if (gradoSiguienteInfo) {
      const posiblesGrupos = gruposDestino?.filter((g: any) => g.gradoId === gradoSiguienteInfo.gradoId) || [];
      if (posiblesGrupos.length > 0) {
        grupoSugerido = posiblesGrupos.find((g: any) => g.nombre.includes(grupoSeleccionado.nombre.replace(/[0-9]/g, ''))) || posiblesGrupos[0];
      }
    }
  }

  const handleInscribir = () => {
    if (!grupoSugerido) {
      alert('No hay grupo sugerido/disponible para inscribir a estos alumnos.');
      return;
    }
    
    const seleccionados = alumnosCandidatos.filter((a: any) => alumnosSeleccionados[a.alumnoId]);
    
    if (seleccionados.length === 0) {
      alert('Debes seleccionar al menos un alumno para inscribir.');
      return;
    }

    const alumnosPorGrupo = {
      [grupoSugerido.grupoId]: seleccionados.map((a: any) => a.alumnoId)
    };

    inscribirMutation.mutate({
      cicloDestinoId,
      alumnosPorGrupo
    });
  };

  if (!selectedGrupoId) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
          <div>
            <button
              onClick={onBack}
              className="text-xs font-bold text-navy-500 hover:text-navy-700 flex items-center gap-1 mb-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Volver a operaciones
            </button>
            <h3 className="text-lg font-bold text-navy-800">Inscripción a Ciclo {cicloDestino?.nombre}</h3>
            <p className="text-xs text-gray-500">Selecciona un grupo del ciclo anterior para inscribir a sus alumnos al siguiente grado.</p>
          </div>
        </div>

        {loadingGrupos ? (
          <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin" size={18} /> Cargando grupos del ciclo origen...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nivel Educativo</th>
                  <th className="px-6 py-4 font-semibold">Grado Origen</th>
                  <th className="px-6 py-4 font-semibold">Grupo Origen</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gruposOrigen?.map((g: any) => (
                  <tr key={g.grupoId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy-800">{g.nivel.nombre}</td>
                    <td className="px-6 py-4 text-gray-700">{g.grado?.nombre || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{g.nombre}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="primary"
                        onClick={() => setSelectedGrupoId(g.grupoId)}
                        className="rounded-xl text-xs py-1.5 px-3"
                      >
                        Inscribir Alumnos
                      </Button>
                    </td>
                  </tr>
                ))}
                {gruposOrigen?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No hay grupos registrados en el ciclo de origen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const refetchGruposDestino = () => {
    utils.grupos.getGrupos.invalidate({ cicloId: cicloDestinoId });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <button
            onClick={() => setSelectedGrupoId(null)}
            className="text-xs font-bold text-navy-500 hover:text-navy-700 flex items-center gap-1 mb-1 cursor-pointer"
          >
            <ArrowLeft size={14} /> Volver a grupos
          </button>
          <h3 className="text-lg font-bold text-navy-800">
            Inscripción — Desde {grupoSeleccionado?.nombre} ({grupoSeleccionado?.nivel.nombre})
          </h3>
          <p className="text-xs text-gray-500">Revisa la lista de alumnos que avanzan al siguiente grado.</p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
        {esEgresoDefinitivo ? (
          <div>
            <h4 className="font-bold text-emerald-900 mb-1">Egreso de Nivel</h4>
            <p className="text-sm text-emerald-800">
              Estos alumnos concluyeron el bachillerato. Al cerrar el ciclo, pasan directamente como <strong>Egresados</strong> y no requieren inscripción a un nuevo grado.
            </p>
          </div>
        ) : gradoSiguienteInfo ? (
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Destino: {gradoSiguienteInfo.nombre}</h4>
            {grupoSugerido ? (
              <p className="text-sm text-blue-800">
                Estos alumnos serán inscritos en el grado <strong>{gradoSiguienteInfo.nombre}</strong>, grupo <strong>{grupoSugerido.nombre}</strong>.
              </p>
            ) : (
              <div className="flex flex-col items-start gap-2 mt-2">
                <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> No existe un grupo creado para {gradoSiguienteInfo.nombre} en el ciclo destino. Debes crear el grupo manualmente primero.
                </p>
                <Button variant="outline" className="text-xs py-1.5" onClick={() => setIsGrupoModalOpen(true)}>
                  <PlusCircle size={14} className="mr-1" /> Crear Grupo para {gradoSiguienteInfo.nombre}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> No se pudo determinar el siguiente grado. Es posible que estén en el último grado de su nivel.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2">
          <Users size={18} /> Alumnos Candidatos ({alumnosCandidatos.length})
        </h4>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-navy-600 focus:ring-navy-500 cursor-pointer"
                    checked={alumnosCandidatos.length > 0 && alumnosCandidatos.every((a: any) => alumnosSeleccionados[a.alumnoId])}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const next: Record<number, boolean> = {};
                      alumnosCandidatos.forEach((a: any) => next[a.alumnoId] = checked);
                      setAlumnosSeleccionados(next);
                    }}
                  />
                </th>
                <th className="px-6 py-3 font-semibold">Matrícula</th>
                <th className="px-6 py-3 font-semibold">Nombre</th>
                <th className="px-6 py-3 font-semibold">Estado Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alumnosCandidatos.map((a: any) => (
                <tr key={a.alumnoId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-navy-600 focus:ring-navy-500 cursor-pointer"
                      checked={alumnosSeleccionados[a.alumnoId] || false}
                      onChange={(e) => {
                        setAlumnosSeleccionados(prev => ({
                          ...prev,
                          [a.alumnoId]: e.target.checked
                        }));
                      }}
                    />
                  </td>
                  <td className="px-6 py-3 text-gray-500">{a.matricula || '-'}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{a.nombreCompleto}</td>
                  <td className="px-6 py-3 text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                      a.estado === 'TRANSICION_PENDIENTE' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {alumnosCandidatos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                    No hay alumnos registrados en este grupo del ciclo anterior.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="ghost" onClick={() => setSelectedGrupoId(null)}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          disabled={esEgresoDefinitivo || !grupoSugerido || alumnosCandidatos.length === 0 || inscribirMutation.isLoading}
          onClick={handleInscribir}
          isLoading={inscribirMutation.isLoading}
        >
          Confirmar Inscripción
        </Button>
      </div>

      <GrupoFormModal
        isOpen={isGrupoModalOpen}
        onClose={() => {
          setIsGrupoModalOpen(false);
          refetchGruposDestino();
        }}
        defaultCicloId={cicloDestinoId}
        defaultNivelId={gradoSiguienteInfo?.nivelId || nivelActual?.nivelId}
        defaultGradoId={gradoSiguienteInfo?.gradoId}
      />
    </div>
  );
}
