import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(80),
  clave: z.string().min(1, 'La clave es requerida').max(20),
  gradoId: z.string().optional().nullable(),
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

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', clave: '', gradoId: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombre: initialData.nombre,
          clave: initialData.clave,
          gradoId: initialData.gradoId ? String(initialData.gradoId) : '',
        });
      } else {
        reset({ nombre: '', clave: '', gradoId: '' });
      }
    }
  }, [isOpen, initialData, reset]);

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
      clave: data.clave,
      gradoId: data.gradoId ? parseInt(data.gradoId, 10) : null,
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="clave"
            control={control}
            render={({ field }) => (
              <Input 
                {...field} 
                label="Clave de la Materia (Ej. MAT-101)" 
                error={errors.clave?.message} 
                disabled={isSaving || isEditing} 
              />
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
                  {grados?.map(g => <option key={g.gradoId} value={g.gradoId}>{g.nombre}</option>)}
                </select>
                {errors.gradoId && <span className="text-xs text-red-600">{errors.gradoId.message}</span>}
              </div>
            )}
          />
        </div>

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
