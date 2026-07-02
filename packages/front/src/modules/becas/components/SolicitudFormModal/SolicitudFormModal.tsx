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
  becaId: z.string().min(1, 'Requerido'),
  cicloId: z.string().min(1, 'Requerido'),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SolicitudFormModal({ isOpen, onClose }: Props) {
  const utils = trpc.useUtils();

  const { data: alumnos } = trpc.alumnos.getAll.useQuery(undefined, { enabled: isOpen });
  const { data: becas } = trpc.becas.getBecas.useQuery(undefined, { enabled: isOpen });
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { alumnoId: '', becaId: '', cicloId: '', motivo: '', observaciones: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ alumnoId: '', becaId: '', cicloId: '', motivo: '', observaciones: '' });
    }
  }, [isOpen, reset]);

  const createMutation = trpc.becas.createSolicitud.useMutation({
    onSuccess: () => {
      utils.becas.getSolicitudes.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      alumnoId: parseInt(data.alumnoId, 10),
      becaId: parseInt(data.becaId, 10),
      cicloId: parseInt(data.cicloId, 10),
      motivo: data.motivo || undefined,
      observaciones: data.observaciones || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Solicitud de Beca"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        <Controller
          name="alumnoId"
          control={control}
          render={({ field }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Alumno Solicitante</label>
              <select {...field} disabled={createMutation.isPending} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="">Selecciona al Alumno...</option>
                {alumnos?.map((a: any) => <option key={a.alumnoId} value={a.alumnoId}>{a.nombres} {a.apellidos}</option>)}
              </select>
              {errors.alumnoId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.alumnoId.message}</span>}
            </div>
          )}
        />

        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <Controller
            name="becaId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Tipo de Beca</label>
                <select {...field} disabled={createMutation.isPending} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {becas?.map((b: any) => <option key={b.becaId} value={b.becaId}>{b.nombreBeca} ({b.porcentaje}%)</option>)}
                </select>
                {errors.becaId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.becaId.message}</span>}
              </div>
            )}
          />
          <Controller
            name="cicloId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Para el Ciclo Escolar</label>
                <select {...field} disabled={createMutation.isPending} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {ciclos?.map((c: any) => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
                </select>
                {errors.cicloId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.cicloId.message}</span>}
              </div>
            )}
          />
        </div>

        <Controller
          name="motivo"
          control={control}
          render={({ field }) => (
            <div style={{ marginTop: '8px' }}>
              <Input {...field} label="Motivo principal (Opcional)" error={errors.motivo?.message} disabled={createMutation.isPending} />
            </div>
          )}
        />
        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Observaciones (Opcional)" error={errors.observaciones?.message} disabled={createMutation.isPending} />
          )}
        />

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Enviar Solicitud
          </Button>
        </div>
      </form>
    </Modal>
  );
}
