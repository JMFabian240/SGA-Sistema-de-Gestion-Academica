import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../../lib/trpc';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import styles from '../../../grupos/components/NivelFormModal/FormModal.module.css';

const CriterioBecaEnum = z.enum([
  'ACADEMICA', 'SOCIOECONOMICA', 'DEPORTIVA', 
  'CULTURAL', 'POR_HERMANOS', 'PROMOCION_TEMPRANA', 'EXTERNA'
]);

const schema = z.object({
  nombreBeca: z.string().min(1, 'Requerido').max(60, 'Máximo 60 caracteres'),
  criterio: CriterioBecaEnum,
  porcentaje: z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  becaId?: number;
  initialData?: any;
};

export function BecaFormModal({ isOpen, onClose, becaId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!becaId;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombreBeca: '', criterio: 'ACADEMICA', porcentaje: '', descripcion: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombreBeca: initialData.nombreBeca,
          criterio: initialData.criterio,
          porcentaje: String(initialData.porcentaje),
          descripcion: initialData.descripcion || '',
        });
      } else {
        reset({ nombreBeca: '', criterio: 'ACADEMICA', porcentaje: '', descripcion: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.becas.createBeca.useMutation({
    onSuccess: () => {
      utils.becas.getBecas.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.becas.updateBeca.useMutation({
    onSuccess: () => {
      utils.becas.getBecas.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      nombreBeca: data.nombreBeca,
      criterio: data.criterio,
      porcentaje: parseFloat(data.porcentaje),
      descripcion: data.descripcion || undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ becaId: becaId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Beca' : 'Nueva Beca'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        <Controller
          name="nombreBeca"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Nombre de Beca (Ej. Académica 100%)" error={errors.nombreBeca?.message} disabled={isSaving} />
          )}
        />

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="criterio"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Criterio / Tipo</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="ACADEMICA">Académica</option>
                  <option value="SOCIOECONOMICA">Socioeconómica</option>
                  <option value="DEPORTIVA">Deportiva</option>
                  <option value="CULTURAL">Cultural</option>
                  <option value="POR_HERMANOS">Por Hermanos</option>
                  <option value="PROMOCION_TEMPRANA">Promoción Temprana</option>
                  <option value="EXTERNA">Externa</option>
                </select>
                {errors.criterio && <span style={{ color: 'red', fontSize: '12px' }}>{errors.criterio.message}</span>}
              </div>
            )}
          />
          <Controller
            name="porcentaje"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1 }}>
                <Input {...field} type="number" step="0.01" label="Porcentaje de Descuento (%)" error={errors.porcentaje?.message} disabled={isSaving} />
              </div>
            )}
          />
        </div>

        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Descripción / Requisitos" error={errors.descripcion?.message} disabled={isSaving} />
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
