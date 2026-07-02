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
  nivelId: z.string().min(1, 'Requerido'),
  concepto: z.string().min(1, 'Requerido').max(15, 'Máximo 15 caracteres'),
  monto: z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
  activa: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tarifaId?: number;
  initialData?: any;
};

export function TarifaFormModal({ isOpen, onClose, tarifaId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!tarifaId;

  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: niveles } = trpc.grupos.getNiveles.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cicloId: '', nivelId: '', concepto: '', monto: '', descripcion: '', activa: true },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          cicloId: String(initialData.cicloId),
          nivelId: String(initialData.nivelId),
          concepto: initialData.concepto,
          monto: String(initialData.monto),
          descripcion: initialData.descripcion || '',
          activa: initialData.activa,
        });
      } else {
        reset({ cicloId: '', nivelId: '', concepto: '', monto: '', descripcion: '', activa: true });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.pagos.createTarifa.useMutation({
    onSuccess: () => {
      utils.pagos.getTarifas.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.pagos.updateTarifa.useMutation({
    onSuccess: () => {
      utils.pagos.getTarifas.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      cicloId: parseInt(data.cicloId, 10),
      nivelId: parseInt(data.nivelId, 10),
      concepto: data.concepto,
      monto: parseFloat(data.monto),
      descripcion: data.descripcion || undefined,
      activa: data.activa !== false, // default true
    };

    if (isEditing) {
      updateMutation.mutate({ tarifaId: tarifaId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tarifa' : 'Nueva Tarifa'}
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
            name="nivelId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Nivel Académico</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {niveles?.map((n: any) => <option key={n.nivelId} value={n.nivelId}>{n.nombre}</option>)}
                </select>
                {errors.nivelId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.nivelId.message}</span>}
              </div>
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="concepto"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 2 }}>
                <Input {...field} label="Concepto (Ej. Inscripción, Col.)" error={errors.concepto?.message} disabled={isSaving} />
              </div>
            )}
          />
          <Controller
            name="monto"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1 }}>
                <Input {...field} type="number" step="0.01" label="Monto Base ($)" error={errors.monto?.message} disabled={isSaving} />
              </div>
            )}
          />
        </div>

        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Descripción detallada (Opcional)" error={errors.descripcion?.message} disabled={isSaving} />
          )}
        />

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
              <label htmlFor="activa-chk" style={{ fontSize: '14px', fontWeight: 500 }}>Tarifa Activa (Aplica a este ciclo)</label>
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
