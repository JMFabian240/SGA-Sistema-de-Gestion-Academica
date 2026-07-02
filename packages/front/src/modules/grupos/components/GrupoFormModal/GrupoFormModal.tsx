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
  nombre: z.string().min(1, 'Requerido'),
  cupoMaximo: z.string().min(1, 'Requerido'),
  cicloId: z.string().min(1, 'Requerido'),
  nivelId: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  grupoId?: number;
  initialData?: any;
};

export function GrupoFormModal({ isOpen, onClose, grupoId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!grupoId;

  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: niveles } = trpc.grupos.getNiveles.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', cupoMaximo: '30', cicloId: '', nivelId: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombre: initialData.nombre,
          cupoMaximo: String(initialData.cupoMaximo || 30),
          cicloId: String(initialData.cicloId),
          nivelId: String(initialData.nivelId),
        });
      } else {
        reset({ nombre: '', cupoMaximo: '30', cicloId: '', nivelId: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.grupos.createGrupo.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.grupos.updateGrupo.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      nombre: data.nombre,
      cupoMaximo: parseInt(data.cupoMaximo, 10),
      cicloId: parseInt(data.cicloId, 10),
      nivelId: parseInt(data.nivelId, 10),
    };

    if (isEditing) {
      updateMutation.mutate({ grupoId: grupoId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
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
                  {ciclos?.map(c => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
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
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Nivel Educativo</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {niveles?.map(n => <option key={n.nivelId} value={n.nivelId}>{n.nombre}</option>)}
                </select>
                {errors.nivelId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.nivelId.message}</span>}
              </div>
            )}
          />
        </div>

        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Nombre del Grupo (Ej. 1ro A Primaria)" error={errors.nombre?.message} disabled={isSaving} />
          )}
        />

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="cupoMaximo"
            control={control}
            render={({ field }) => (
              <Input {...field} type="number" label="Cupo Máximo" error={errors.cupoMaximo?.message} disabled={isSaving} />
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
