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
  cicloId: z.string().min(1, 'Requerido'),
  becaId: z.string().min(1, 'Requerido'),
  fechaInicio: z.string().min(1, 'Requerida'),
  fechaFin: z.string().min(1, 'Requerida'),
  activa: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  ventanaId?: number;
  initialData?: any;
};

export function VentanaFormModal({ isOpen, onClose, ventanaId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!ventanaId;

  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: becas } = trpc.becas.getBecas.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cicloId: '', becaId: '', fechaInicio: '', fechaFin: '', activa: true },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Formatear datetime a date para HTML input
        const start = new Date(initialData.fechaInicio).toISOString().split('T')[0];
        const end = new Date(initialData.fechaFin).toISOString().split('T')[0];
        reset({
          cicloId: String(initialData.cicloId),
          becaId: String(initialData.becaId),
          fechaInicio: start,
          fechaFin: end,
          activa: initialData.activa,
        });
      } else {
        reset({ cicloId: '', becaId: '', fechaInicio: '', fechaFin: '', activa: true });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.inscripciones.createVentana.useMutation({
    onSuccess: () => {
      utils.inscripciones.getVentanas.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.inscripciones.updateVentana.useMutation({
    onSuccess: () => {
      utils.inscripciones.getVentanas.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      cicloId: parseInt(data.cicloId, 10),
      becaId: parseInt(data.becaId, 10),
      fechaInicio: new Date(data.fechaInicio).toISOString(), // Backend requires ISO datetime string
      fechaFin: new Date(data.fechaFin).toISOString(),
      activa: data.activa !== false, // default true
    };

    if (isEditing) {
      updateMutation.mutate({ ventanaId: ventanaId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ventana de Inscripción' : 'Nueva Ventana de Inscripción'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="cicloId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Ciclo Escolar</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {ciclos?.map((c: any) => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
                </select>
                {errors.cicloId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.cicloId.message}</span>}
              </div>
            )}
          />
          <Controller
            name="becaId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Aplica Beca (%)</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {becas?.map((b: any) => <option key={b.becaId} value={b.becaId}>{b.nombre} ({b.porcentaje}%)</option>)}
                </select>
                {errors.becaId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.becaId.message}</span>}
              </div>
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="fechaInicio"
            control={control}
            render={({ field }) => (
              <Input {...field} type="date" label="Abre el:" error={errors.fechaInicio?.message} disabled={isSaving} />
            )}
          />
          <Controller
            name="fechaFin"
            control={control}
            render={({ field }) => (
              <Input {...field} type="date" label="Cierra el:" error={errors.fechaFin?.message} disabled={isSaving} />
            )}
          />
        </div>

        <Controller
          name="activa"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input 
                type="checkbox" 
                id="activa-chk"
                checked={value} 
                onChange={(e) => onChange(e.target.checked)} 
                disabled={isSaving} 
              />
              <label htmlFor="activa-chk" style={{ fontSize: '14px', fontWeight: 500 }}>Ventana Activa (En progreso)</label>
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
