import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { CrearMateriaRapidaModal } from './CrearMateriaRapidaModal';
import { CrearDocenteRapidoModal } from './CrearDocenteRapidoModal';

const schema = z.object({
  materiaId: z.string().min(1, 'Debes seleccionar una materia'),
  docenteId: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  gradoId: number;
  onSuccess?: () => void;
};

export function AsignarMateriaModal({ isOpen, onClose, gradoId, onSuccess }: Props) {
  const utils = trpc.useUtils();

  const { data: materiasData, isLoading: isLoadingMaterias } = trpc.grupos.getMaterias.useQuery(undefined, { enabled: isOpen });
  const materias = materiasData as any[] | undefined;
  const { data: docentes, isLoading: isLoadingDocentes } = trpc.grupos.getDocentes.useQuery(undefined, { enabled: isOpen });

  const [docenteSearchQuery, setDocenteSearchQuery] = useState('');
  const [showDocenteDropdown, setShowDocenteDropdown] = useState(false);
  const [isCrearMateriaOpen, setIsCrearMateriaOpen] = useState(false);
  const [isCrearDocenteOpen, setIsCrearDocenteOpen] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { materiaId: '', docenteId: '' },
  });

  const filteredDocentes = docentes?.filter(d =>
    d.nombreCompleto.toLowerCase().includes(docenteSearchQuery.toLowerCase())
  ) || [];

  useEffect(() => {
    if (isOpen) {
      reset({ materiaId: '', docenteId: '' });
      setDocenteSearchQuery('');
      setShowDocenteDropdown(false);
    }
  }, [isOpen, reset]);

  const updateMateriaMutation = trpc.grupos.updateMateria.useMutation({
    onSuccess: () => {
      utils.grupos.getMaterias.invalidate();
      utils.grupos.getGrupos.invalidate();
      if (onSuccess) onSuccess();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      materiaId: parseInt(data.materiaId, 10),
      gradoId: gradoId,
      docenteId: data.docenteId ? parseInt(data.docenteId, 10) : null,
    };
    updateMateriaMutation.mutate(payload);
  };

  const isSaving = updateMateriaMutation.isPending;

  // Filtrar materias que no tienen ningún grado asignado (materias libres)
  const materiasDisponibles = materias?.filter(m => m.gradoId === null) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Materia al Grado"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="materiaId"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Seleccionar Materia</label>
                <button
                  type="button"
                  onClick={() => setIsCrearMateriaOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold focus:outline-none"
                >
                  + Crear nueva materia
                </button>
              </div>
              <select
                {...field}
                disabled={isSaving || isLoadingMaterias}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="">-- Elige una materia --</option>
                {materiasDisponibles.map(m => (
                  <option key={m.materiaId} value={m.materiaId}>
                    {m.nombre} {m.grado?.nombre ? `(Asignada a: ${m.grado.nombre})` : '(Sin asignar)'}
                  </option>
                ))}
              </select>
              {errors.materiaId && <span className="text-xs text-red-600">{errors.materiaId.message}</span>}
            </div>
          )}
        />

        {/* Docente Asignado */}
        <Controller
          name="docenteId"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1 relative">
              <label className="text-sm font-medium text-gray-700">Docente Titular (Opcional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar maestro por nombre..."
                  disabled={isSaving || isLoadingDocentes}
                  value={docenteSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDocenteSearchQuery(val);
                    setShowDocenteDropdown(true);
                    if (!val) {
                      field.onChange('');
                    }
                  }}
                  onFocus={() => setShowDocenteDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowDocenteDropdown(false), 200);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
                />
                {docenteSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setDocenteSearchQuery('');
                      field.onChange('');
                    }}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold"
                  >
                    &times;
                  </button>
                )}
              </div>
              {showDocenteDropdown && (
                <div className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredDocentes.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-gray-500 italic">No se encontraron docentes</div>
                  ) : (
                    filteredDocentes.map(d => (
                      <div
                        key={d.usuarioId}
                        onMouseDown={() => {
                          field.onChange(String(d.usuarioId));
                          setDocenteSearchQuery(d.nombreCompleto);
                          setShowDocenteDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 font-medium transition-colors"
                      >
                        {d.nombreCompleto}
                      </div>
                    ))
                  )}
                  <div 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsCrearDocenteOpen(true);
                      setShowDocenteDropdown(false);
                    }}
                    className="px-4 py-2 border-t border-gray-100 hover:bg-blue-50 cursor-pointer text-xs text-blue-600 font-bold transition-colors text-center"
                  >
                    + Crear nuevo docente
                  </div>
                </div>
              )}
              {errors.docenteId && <span className="text-xs text-red-600">{errors.docenteId.message}</span>}
            </div>
          )}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Asignar
          </Button>
        </div>
      </form>

      <CrearMateriaRapidaModal
        isOpen={isCrearMateriaOpen}
        onClose={() => setIsCrearMateriaOpen(false)}
        onSuccess={(materiaId) => {
          utils.grupos.getMaterias.invalidate();
          setValue('materiaId', String(materiaId));
        }}
      />

      <CrearDocenteRapidoModal
        isOpen={isCrearDocenteOpen}
        onClose={() => setIsCrearDocenteOpen(false)}
        onSuccess={(usuarioId, nombreCompleto) => {
          utils.grupos.getDocentes.invalidate();
          setValue('docenteId', String(usuarioId));
          setDocenteSearchQuery(nombreCompleto);
        }}
      />
    </Modal>
  );
}
