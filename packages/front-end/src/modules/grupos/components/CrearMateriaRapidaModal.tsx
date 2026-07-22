import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(80),
  clave: z.string().max(20).optional(),
  tipo: z.enum(['curricular', 'extracurricular', 'taller']),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (materiaId: number) => void;
};

export function CrearMateriaRapidaModal({ isOpen, onClose, onSuccess }: Props) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', clave: '', tipo: 'curricular' },
  });

  const createMutation = trpc.grupos.createMateria.useMutation({
    onSuccess: (data) => {
      reset();
      onSuccess(data.materiaId);
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      nombre: data.nombre,
      clave: data.clave || undefined,
      tipo: data.tipo,
    });
  };

  const isSaving = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Materia"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nombre de la Materia</label>
              <input
                {...field}
                type="text"
                disabled={isSaving}
                placeholder="Ej. Matemáticas I"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              />
              {errors.nombre && <span className="text-xs text-red-600">{errors.nombre.message}</span>}
            </div>
          )}
        />

        <Controller
          name="clave"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Clave (Opcional)</label>
              <input
                {...field}
                type="text"
                disabled={isSaving}
                placeholder="Ej. MAT-1"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              />
              {errors.clave && <span className="text-xs text-red-600">{errors.clave.message}</span>}
            </div>
          )}
        />

        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tipo de Materia</label>
              <select
                {...field}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="curricular">Curricular</option>
                <option value="extracurricular">Extracurricular</option>
                <option value="taller">Taller</option>
              </select>
              {errors.tipo && <span className="text-xs text-red-600">{errors.tipo.message}</span>}
            </div>
          )}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Crear Materia
          </Button>
        </div>
      </form>
    </Modal>
  );
}
