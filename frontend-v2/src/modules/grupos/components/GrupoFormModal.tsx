import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  cupoMaximo: z.string().min(1, 'El cupo es requerido'),
  cicloId: z.string().min(1, 'El ciclo es requerido'),
  nivelId: z.string().min(1, 'El nivel es requerido'),
  gradoId: z.string().min(1, 'El grado es requerido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  grupoId?: number;
  initialData?: any;
};

export function GrupoFormModal({ isOpen, onClose, grupoId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!grupoId;

  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: niveles } = trpc.grupos.getNiveles.useQuery(undefined, { enabled: isOpen });
  const { data: grados } = trpc.grupos.getGrados.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', cupoMaximo: '30', cicloId: '', nivelId: '', gradoId: '' },
  });

  const selectedNivelId = watch('nivelId');
  const filteredGrados = selectedNivelId
    ? grados?.filter(g => String(g.nivelId) === selectedNivelId)
    : grados;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombre: initialData.nombre,
          cupoMaximo: String(initialData.cupoMaximo || 30),
          cicloId: String(initialData.cicloId),
          nivelId: String(initialData.nivelId),
          gradoId: String(initialData.gradoId),
        });
      } else {
        reset({ nombre: '', cupoMaximo: '30', cicloId: '', nivelId: '', gradoId: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.grupos.createGrupo.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.grupos.updateGrupo.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      nombre: data.nombre,
      cupoMaximo: parseInt(data.cupoMaximo, 10),
      cicloId: parseInt(data.cicloId, 10),
      nivelId: parseInt(data.nivelId, 10),
      gradoId: parseInt(data.gradoId, 10),
    };

    if (isEditing) {
      updateMutation.mutate({ grupoId: grupoId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="cicloId"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ciclo Escolar</label>
                <select 
                  {...field} 
                  disabled={isSaving} 
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
                >
                  <option value="">Selecciona...</option>
                  {ciclos?.map(c => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
                </select>
                {errors.cicloId && <span className="text-xs text-red-600">{errors.cicloId.message}</span>}
              </div>
            )}
          />
          <Controller
            name="nivelId"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Nivel Educativo</label>
                <select 
                  {...field} 
                  disabled={isSaving} 
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
                >
                  <option value="">Selecciona...</option>
                  {niveles?.map(n => <option key={n.nivelId} value={n.nivelId}>{n.nombre}</option>)}
                </select>
                {errors.nivelId && <span className="text-xs text-red-600">{errors.nivelId.message}</span>}
              </div>
            )}
          />
        </div>

        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <Input 
              {...field} 
              label="Nombre del Grupo (Ej. 1ro A Primaria)" 
              error={errors.nombre?.message} 
              disabled={isSaving} 
            />
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="gradoId"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Grado</label>
                <select 
                  {...field} 
                  disabled={isSaving || !selectedNivelId} 
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedNivelId ? 'Selecciona primero un nivel...' : 'Selecciona...'}
                  </option>
                  {filteredGrados?.map(g => <option key={g.gradoId} value={g.gradoId}>{g.nombre}</option>)}
                </select>
                {errors.gradoId && <span className="text-xs text-red-600">{errors.gradoId.message}</span>}
              </div>
            )}
          />
          <Controller
            name="cupoMaximo"
            control={control}
            render={({ field }) => (
              <Input 
                {...field} 
                type="number" 
                label="Cupo Máximo" 
                error={errors.cupoMaximo?.message} 
                disabled={isSaving} 
              />
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
