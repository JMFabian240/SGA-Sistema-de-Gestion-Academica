import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../../lib/trpc';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import styles from '../NivelFormModal/FormModal.module.css';

const schema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  clave: z.string().min(1, 'La clave es requerida'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  materiaId?: number;
  initialData?: { nombre: string; clave: string; };
};

export function MateriaFormModal({ isOpen, onClose, materiaId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!materiaId;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', clave: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombre: initialData.nombre,
          clave: initialData.clave,
        });
      } else {
        reset({ nombre: '', clave: '' });
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
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Nombre de la Materia"
              placeholder="Ej. Matemáticas I"
              error={errors.nombre?.message}
              disabled={isSaving}
            />
          )}
        />
        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="clave"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Clave"
                placeholder="Ej. MAT101"
                error={errors.clave?.message}
                disabled={isSaving}
              />
            )}
          />
        </div>
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
