import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../../lib/trpc';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import styles from '../../../grupos/components/NivelFormModal/FormModal.module.css';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  meses: z.string().min(1, 'Requerido'),
  montoMensual: z.string().min(1, 'Requerido'),
  montoDiciembre: z.string().optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  planPagoId?: number;
  initialData?: any;
};

export function PlanPagoFormModal({ isOpen, onClose, planPagoId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!planPagoId;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', meses: '10', montoMensual: '', montoDiciembre: '', descripcion: '', activo: true },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombre: initialData.nombre,
          meses: String(initialData.meses),
          montoMensual: String(initialData.montoMensual),
          montoDiciembre: initialData.montoDiciembre ? String(initialData.montoDiciembre) : '',
          descripcion: initialData.descripcion || '',
          activo: initialData.activo,
        });
      } else {
        reset({ nombre: '', meses: '10', montoMensual: '', montoDiciembre: '', descripcion: '', activo: true });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.inscripciones.createPlanPago.useMutation({
    onSuccess: () => {
      utils.inscripciones.getPlanesPago.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.inscripciones.updatePlanPago.useMutation({
    onSuccess: () => {
      utils.inscripciones.getPlanesPago.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      nombre: data.nombre,
      meses: parseInt(data.meses, 10),
      montoMensual: parseFloat(data.montoMensual),
      montoDiciembre: data.montoDiciembre ? parseFloat(data.montoDiciembre) : undefined,
      descripcion: data.descripcion || undefined,
      activo: data.activo !== false, // Default to true if undefined
    };

    if (isEditing) {
      updateMutation.mutate({ planPagoId: planPagoId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plan de Pago' : 'Nuevo Plan de Pago'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Nombre del Plan (Ej. 10 Meses Estándar)" error={errors.nombre?.message} disabled={isSaving} />
          )}
        />
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="meses"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" label="Total de Meses" error={errors.meses?.message} disabled={isSaving} />
            )}
          />
          <Controller
            name="montoMensual"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" step="0.01" label="Monto Mensual ($)" error={errors.montoMensual?.message} disabled={isSaving} />
            )}
          />
        </div>

        <Controller
          name="montoDiciembre"
          control={control}
          render={({ field }) => (
            <Input {...field} type="number" step="0.01" label="Monto Diciembre (Opcional $)" error={errors.montoDiciembre?.message} disabled={isSaving} />
          )}
        />

        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Descripción (Opcional)" error={errors.descripcion?.message} disabled={isSaving} />
          )}
        />

        <Controller
          name="activo"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input 
                type="checkbox" 
                id="activo-chk"
                checked={value} 
                onChange={(e) => onChange(e.target.checked)} 
                disabled={isSaving} 
              />
              <label htmlFor="activo-chk" style={{ fontSize: '14px', fontWeight: 500 }}>Plan Activo (Disponible para elegir)</label>
            </div>
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
