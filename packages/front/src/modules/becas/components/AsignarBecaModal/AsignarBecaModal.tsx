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
  fechaAsignacion: z.string().min(1, 'Requerida'),
  estado: z.enum(['ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'VENCIDA']),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function AsignarBecaModal({ isOpen, onClose }: Props) {
  const { data: alumnos } = trpc.alumnos.getAll.useQuery(undefined, { enabled: isOpen });
  const { data: becas } = trpc.becas.getBecas.useQuery(undefined, { enabled: isOpen });
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { alumnoId: '', becaId: '', cicloId: '', fechaAsignacion: '', estado: 'ACTIVA' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ 
        alumnoId: '', 
        becaId: '', 
        cicloId: '', 
        fechaAsignacion: new Date().toISOString().split('T')[0], 
        estado: 'ACTIVA' 
      });
    }
  }, [isOpen, reset]);

  const assignMutation = trpc.becas.assignBeca.useMutation({
    onSuccess: () => {
      // Nota: Si hubiera un endpoint de getBecasAsignadas, se invalidaría aquí.
      // Suponemos que invalidar listados en la UI o forzar refresh.
      // utils.becas.getBecasAsignadas.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    assignMutation.mutate({
      alumnoId: parseInt(data.alumnoId, 10),
      becaId: parseInt(data.becaId, 10),
      cicloId: parseInt(data.cicloId, 10),
      fechaAsignacion: new Date(data.fechaAsignacion).toISOString(),
      estado: data.estado,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignación Directa de Beca"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        <Controller
          name="alumnoId"
          control={control}
          render={({ field }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Alumno Beneficiario</label>
              <select {...field} disabled={assignMutation.isPending} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
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
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Beca a Otorgar</label>
                <select {...field} disabled={assignMutation.isPending} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
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
                <select {...field} disabled={assignMutation.isPending} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {ciclos?.map((c: any) => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
                </select>
                {errors.cicloId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.cicloId.message}</span>}
              </div>
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <Controller
            name="fechaAsignacion"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1 }}>
                <Input {...field} type="date" label="Fecha de Asignación" error={errors.fechaAsignacion?.message} disabled={assignMutation.isPending} />
              </div>
            )}
          />
          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Estado Inicial</label>
                <select {...field} disabled={assignMutation.isPending} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="ACTIVA">Activa</option>
                  <option value="SUSPENDIDA">Suspendida</option>
                </select>
              </div>
            )}
          />
        </div>

        <div className={styles.actions} style={{ marginTop: '24px' }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={assignMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={assignMutation.isPending}>
            Asignar Beca Directamente
          </Button>
        </div>
      </form>
    </Modal>
  );
}
