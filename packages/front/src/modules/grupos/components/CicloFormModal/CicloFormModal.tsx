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
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cicloId?: number;
  initialData?: { nombre: string; fechaInicio: string; fechaFin: string };
};

export function CicloFormModal({ isOpen, onClose, cicloId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!cicloId;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', fechaInicio: '', fechaFin: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({ nombre: '', fechaInicio: '', fechaFin: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.grupos.createCiclo.useMutation({
    onSuccess: () => {
      utils.grupos.getCiclos.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.grupos.updateCiclo.useMutation({
    onSuccess: () => {
      utils.grupos.getCiclos.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    // El backend espera strings YYYY-MM-DD
    const payload = {
      nombre: data.nombre,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
    };

    if (isEditing) {
      updateMutation.mutate({ cicloId: cicloId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ciclo Escolar' : 'Nuevo Ciclo Escolar'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Nombre del Ciclo"
              placeholder="Ej. 2025-2026"
              error={errors.nombre?.message}
              disabled={isSaving}
            />
          )}
        />
        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="fechaInicio"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                label="Fecha de Inicio"
                error={errors.fechaInicio?.message}
                disabled={isSaving}
              />
            )}
          />
          <Controller
            name="fechaFin"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                label="Fecha de Fin"
                error={errors.fechaFin?.message}
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
