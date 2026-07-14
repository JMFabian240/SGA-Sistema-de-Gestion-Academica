import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(80),
  gradoId: z.string().optional().nullable(),
  tipo: z.enum(['curricular', 'extracurricular', 'taller']),
  docenteId: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  materiaId?: number;
  initialData?: any;
};

export function MateriaFormModal({ isOpen, onClose, materiaId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!materiaId;

  const { data: grados } = trpc.grupos.getGrados.useQuery(undefined, { enabled: isOpen });
  const { data: niveles } = trpc.grupos.getNiveles.useQuery(undefined, { enabled: isOpen });
  const { data: docentes } = trpc.grupos.getDocentes.useQuery(undefined, { enabled: isOpen });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', gradoId: '', tipo: 'curricular', docenteId: '' },
  });

  const filteredDocentes = docentes?.filter(d =>
    d.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getNivelNombre = (nivelId: number) => {
    return niveles?.find(n => n.nivelId === nivelId)?.nombre || '';
  };

  // Synchronize autocomplete input value when initialData/docentes loads
  useEffect(() => {
    if (isOpen && docentes) {
      if (initialData) {
        const doc = docentes.find(d => d.usuarioId === initialData.docenteId);
        setSearchQuery(doc ? doc.nombreCompleto : '');
        reset({
          nombre: initialData.nombre,
          gradoId: initialData.gradoId ? String(initialData.gradoId) : '',
          tipo: (initialData.tipo as any) || 'curricular',
          docenteId: initialData.docenteId ? String(initialData.docenteId) : '',
        });
      } else {
        setSearchQuery('');
        reset({ nombre: '', gradoId: '', tipo: 'curricular', docenteId: '' });
      }
      setShowDropdown(false);
    }
  }, [isOpen, initialData, reset, docentes]);

  const createMutation = trpc.grupos.createMateria.useMutation({
    onSuccess: () => {
      utils.grupos.getMaterias.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.grupos.updateMateria.useMutation({
    onSuccess: () => {
      utils.grupos.getMaterias.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      nombre: data.nombre,
      gradoId: data.gradoId ? parseInt(data.gradoId, 10) : null,
      tipo: data.tipo,
      docenteId: data.docenteId ? parseInt(data.docenteId, 10) : null,
    };

    if (isEditing) {
      updateMutation.mutate({ materiaId: materiaId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Materia' : 'Nueva Materia'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <Input 
              {...field} 
              label="Nombre de la Materia" 
              error={errors.nombre?.message} 
              disabled={isSaving} 
            />
          )}
        />

        {/* Tipo de Materia */}
        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tipo de Materia</label>
              <div className="flex gap-2 mt-1">
                {(['curricular', 'extracurricular', 'taller'] as const).map(tipo => {
                  const isSelected = field.value === tipo;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      disabled={isSaving}
                      onClick={() => field.onChange(tipo)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                        isSelected 
                          ? 'bg-[#001429] border-[#001429] text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tipo === 'extracurricular' ? 'Extra' : tipo}
                    </button>
                  );
                })}
              </div>
              {errors.tipo && <span className="text-xs text-red-600">{errors.tipo.message}</span>}
            </div>
          )}
        />

        <Controller
          name="gradoId"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Grado Escolar (Opcional)</label>
              <select 
                {...field} 
                value={field.value ?? ''}
                disabled={isSaving} 
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="">Ninguno / General</option>
                {grados?.map(g => (
                  <option key={g.gradoId} value={g.gradoId}>
                    {g.nombre} - {getNivelNombre(g.nivelId)}
                  </option>
                ))}
              </select>
              {errors.gradoId && <span className="text-xs text-red-600">{errors.gradoId.message}</span>}
            </div>
          )}
        />

        {/* Docente Asignado (Buscador / Autocompletado) */}
        <Controller
          name="docenteId"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1 relative">
              <label className="text-sm font-medium text-gray-700">Docente Asignado (Opcional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar maestro por nombre..."
                  disabled={isSaving}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setShowDropdown(true);
                    if (!val) {
                      field.onChange('');
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      field.onChange('');
                    }}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold"
                  >
                    &times;
                  </button>
                )}
              </div>
              {showDropdown && (
                <div className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredDocentes.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-gray-500 italic">No se encontraron docentes</div>
                  ) : (
                    filteredDocentes.map(d => (
                      <div
                        key={d.usuarioId}
                        onMouseDown={() => {
                          field.onChange(String(d.usuarioId));
                          setSearchQuery(d.nombreCompleto);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 font-medium transition-colors"
                      >
                        {d.nombreCompleto}
                      </div>
                    ))
                  )}
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
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
