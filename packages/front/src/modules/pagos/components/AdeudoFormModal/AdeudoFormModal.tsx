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
  alumnoId: z.string().min(1, 'Requerido'),
  cicloId: z.string().min(1, 'Requerido'),
  concepto: z.string().min(1, 'Requerido').max(25, 'Máximo 25 caracteres'),
  mes: z.string().optional(),
  fechaVencimiento: z.string().min(1, 'Requerida'),
  montoOriginal: z.string().min(1, 'Requerido'),
  montoPagado: z.string().optional(),
  montoRecargo: z.string().optional(),
  saldoPendiente: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  adeudoId?: number;
  initialData?: any;
};

export function AdeudoFormModal({ isOpen, onClose, adeudoId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!adeudoId;

  const { data: alumnos } = trpc.alumnos.getAll.useQuery(undefined, { enabled: isOpen });
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      alumnoId: '', cicloId: '', concepto: '', mes: '', 
      fechaVencimiento: '', montoOriginal: '', montoPagado: '0', 
      montoRecargo: '0', saldoPendiente: '' 
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const fv = new Date(initialData.fechaVencimiento).toISOString().split('T')[0];
        reset({
          alumnoId: String(initialData.alumnoId),
          cicloId: String(initialData.cicloId),
          concepto: initialData.concepto,
          mes: initialData.mes || '',
          fechaVencimiento: fv,
          montoOriginal: String(initialData.montoOriginal),
          montoPagado: String(initialData.montoPagado || 0),
          montoRecargo: String(initialData.montoRecargo || 0),
          saldoPendiente: String(initialData.saldoPendiente),
        });
      } else {
        reset({ 
          alumnoId: '', cicloId: '', concepto: '', mes: '', 
          fechaVencimiento: '', montoOriginal: '', montoPagado: '0', 
          montoRecargo: '0', saldoPendiente: '' 
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.pagos.createAdeudo.useMutation({
    onSuccess: () => {
      utils.pagos.getAdeudos.invalidate(); // Invalidate el listado global o por alumno
      onClose();
    }
  });

  const updateMutation = trpc.pagos.updateAdeudo.useMutation({
    onSuccess: () => {
      utils.pagos.getAdeudos.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      alumnoId: parseInt(data.alumnoId, 10),
      cicloId: parseInt(data.cicloId, 10),
      concepto: data.concepto,
      mes: data.mes || undefined,
      fechaVencimiento: new Date(data.fechaVencimiento).toISOString(),
      montoOriginal: parseFloat(data.montoOriginal),
      montoPagado: data.montoPagado ? parseFloat(data.montoPagado) : 0,
      montoRecargo: data.montoRecargo ? parseFloat(data.montoRecargo) : 0,
      saldoPendiente: parseFloat(data.saldoPendiente),
    };

    if (isEditing) {
      updateMutation.mutate({ calendarioPagoId: adeudoId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Adeudo' : 'Generar Adeudo Manual'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        <Controller
          name="alumnoId"
          control={control}
          render={({ field }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Alumno Deudor</label>
              <select {...field} disabled={isSaving || isEditing} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="">Selecciona al Alumno...</option>
                {alumnos?.map((a: any) => <option key={a.alumnoId} value={a.alumnoId}>{a.nombres} {a.apellidos}</option>)}
              </select>
              {errors.alumnoId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.alumnoId.message}</span>}
            </div>
          )}
        />

        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
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
            name="concepto"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 2 }}>
                <Input {...field} label="Concepto (Ej. Colegiatura, Evento)" error={errors.concepto?.message} disabled={isSaving} />
              </div>
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="mes"
            control={control}
            render={({ field }) => (
              <Input {...field} label="Mes (Opcional, Ej. Septiembre)" error={errors.mes?.message} disabled={isSaving} />
            )}
          />
          <Controller
            name="fechaVencimiento"
            control={control}
            render={({ field }) => (
              <Input {...field} type="date" label="Vencimiento" error={errors.fechaVencimiento?.message} disabled={isSaving} />
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="montoOriginal"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" step="0.01" label="Monto Base ($)" error={errors.montoOriginal?.message} disabled={isSaving} />
            )}
          />
          <Controller
            name="saldoPendiente"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" step="0.01" label="Saldo Pendiente ($)" error={errors.saldoPendiente?.message} disabled={isSaving} />
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="montoPagado"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" step="0.01" label="Monto Abonado ($)" error={errors.montoPagado?.message} disabled={isSaving} />
            )}
          />
          <Controller
            name="montoRecargo"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" step="0.01" label="Recargos ($)" error={errors.montoRecargo?.message} disabled={isSaving} />
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
