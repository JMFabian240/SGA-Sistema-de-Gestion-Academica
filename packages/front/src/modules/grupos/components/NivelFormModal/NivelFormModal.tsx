import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../../lib/trpc';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import styles from './FormModal.module.css'; // Compartido

const schema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  rvoe: z.string().optional(),
  orden: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  nivelId?: number; // Si viene, es edición
  initialData?: { codigo: string; nombre: string; rvoe?: string; orden: number };
};

export function NivelFormModal({ isOpen, onClose, nivelId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!nivelId;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { codigo: '', nombre: '', rvoe: '', orden: '1' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          codigo: initialData.codigo,
          nombre: initialData.nombre,
          rvoe: initialData.rvoe || '',
          orden: String(initialData.orden)
        });
      } else {
        reset({ codigo: '', nombre: '', rvoe: '', orden: '1' });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.grupos.createNivel.useMutation({
    onSuccess: () => {
      utils.grupos.getNiveles.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.grupos.updateNivel.useMutation({
    onSuccess: () => {
      utils.grupos.getNiveles.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      codigo: data.codigo,
      nombre: data.nombre,
      rvoe: data.rvoe,
      orden: parseInt(data.orden, 10),
    };

    if (isEditing) {
      updateMutation.mutate({ nivelId: nivelId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Nivel Educativo' : 'Nuevo Nivel Educativo'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="codigo"
            control={control}
            render={({ field }) => (
              <Input {...field} label="Código" placeholder="Ej. PRI" error={errors.codigo?.message} disabled={isSaving} />
            )}
          />
          <Controller
            name="orden"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" label="Orden" placeholder="1" error={errors.orden?.message} disabled={isSaving} />
            )}
          />
        </div>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Nombre del Nivel"
              placeholder="Ej. Primaria"
              error={errors.nombre?.message}
              disabled={isSaving}
            />
          )}
        />
        <Controller
          name="rvoe"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="RVOE (Opcional)"
              placeholder="Ej. 123456"
              error={errors.rvoe?.message}
              disabled={isSaving}
            />
          )}
        />
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
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
