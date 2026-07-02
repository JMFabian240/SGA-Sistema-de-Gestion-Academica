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
  grupoId: z.string().optional(),
  planPagoId: z.string().min(1, 'Requerido'),
  fechaIngreso: z.string().min(1, 'Requerida'),
  esIngresoTardio: z.boolean().optional(),
  estadoEnCiclo: z.string().min(1, 'Requerido'),
  estadoFinanciero: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  inscripcionId?: number;
  initialData?: any;
};

export function InscripcionFormModal({ isOpen, onClose, inscripcionId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!inscripcionId;

  // Carga de catálogos necesarios para los selectores
  const { data: alumnos } = trpc.alumnos.getAll.useQuery(undefined, { enabled: isOpen });
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: grupos } = trpc.grupos.getGrupos.useQuery({}, { enabled: isOpen });
  const { data: planes } = trpc.inscripciones.getPlanesPago.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      alumnoId: '', cicloId: '', grupoId: '', planPagoId: '', 
      fechaIngreso: '', esIngresoTardio: false, 
      estadoEnCiclo: 'INSCRITO', estadoFinanciero: 'AL_CORRIENTE' 
    },
  });

  const selectedCicloId = watch('cicloId');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const fi = new Date(initialData.fechaIngreso).toISOString().split('T')[0];
        reset({
          alumnoId: String(initialData.alumnoId),
          cicloId: String(initialData.cicloId),
          grupoId: initialData.grupoId ? String(initialData.grupoId) : '',
          planPagoId: String(initialData.planPagoId),
          fechaIngreso: fi,
          esIngresoTardio: initialData.esIngresoTardio,
          estadoEnCiclo: initialData.estadoEnCiclo,
          estadoFinanciero: initialData.estadoFinanciero,
        });
      } else {
        reset({ 
          alumnoId: '', cicloId: '', grupoId: '', planPagoId: '', 
          fechaIngreso: new Date().toISOString().split('T')[0], // Hoy por defecto
          esIngresoTardio: false, 
          estadoEnCiclo: 'INSCRITO', estadoFinanciero: 'AL_CORRIENTE' 
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.inscripciones.createInscripcion.useMutation({
    onSuccess: () => {
      utils.inscripciones.getInscripciones.invalidate();
      onClose();
    }
  });

  const updateMutation = trpc.inscripciones.updateInscripcion.useMutation({
    onSuccess: () => {
      utils.inscripciones.getInscripciones.invalidate();
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      alumnoId: parseInt(data.alumnoId, 10),
      cicloId: parseInt(data.cicloId, 10),
      grupoId: data.grupoId ? parseInt(data.grupoId, 10) : undefined,
      planPagoId: parseInt(data.planPagoId, 10),
      fechaIngreso: new Date(data.fechaIngreso).toISOString(), // Backend requiere ISO datetime string
      esIngresoTardio: !!data.esIngresoTardio,
      estadoEnCiclo: data.estadoEnCiclo,
      estadoFinanciero: data.estadoFinanciero,
    };

    if (isEditing) {
      updateMutation.mutate({ inscripcionId: inscripcionId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Filtrar grupos por el ciclo seleccionado si es necesario
  const gruposFiltrados = selectedCicloId 
    ? (grupos as any[])?.filter(g => g.cicloId === parseInt(selectedCicloId, 10)) 
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Inscripción' : 'Nueva Inscripción'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        <Controller
          name="alumnoId"
          control={control}
          render={({ field }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Alumno</label>
              <select {...field} disabled={isSaving || isEditing} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="">Selecciona al Alumno...</option>
                {alumnos?.map((a: any) => <option key={a.alumnoId} value={a.alumnoId}>{a.nombres} {a.apellidos}</option>)}
              </select>
              {errors.alumnoId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.alumnoId.message}</span>}
            </div>
          )}
        />

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="cicloId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Ciclo a Inscribir</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {ciclos?.map((c: any) => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
                </select>
                {errors.cicloId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.cicloId.message}</span>}
              </div>
            )}
          />
          <Controller
            name="grupoId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Grupo (Opcional por ahora)</label>
                <select {...field} disabled={isSaving || !selectedCicloId} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Sin Asignar</option>
                  {gruposFiltrados?.map(g => <option key={g.grupoId} value={g.grupoId}>{g.nombre} ({g.nivel?.nombre})</option>)}
                </select>
                {errors.grupoId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.grupoId.message}</span>}
              </div>
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="planPagoId"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Plan de Pago</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Selecciona...</option>
                  {planes?.map((p: any) => <option key={p.planPagoId} value={p.planPagoId}>{p.nombre}</option>)}
                </select>
                {errors.planPagoId && <span style={{ color: 'red', fontSize: '12px' }}>{errors.planPagoId.message}</span>}
              </div>
            )}
          />
          <Controller
            name="fechaIngreso"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1 }}>
                <Input {...field} type="date" label="Fecha Ingreso" error={errors.fechaIngreso?.message} disabled={isSaving} />
              </div>
            )}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          <Controller
            name="estadoEnCiclo"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Estado Académico</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="INSCRITO">Inscrito</option>
                  <option value="BAJA">Dado de Baja</option>
                  <option value="EGRESADO">Egresado</option>
                </select>
              </div>
            )}
          />
          <Controller
            name="estadoFinanciero"
            control={control}
            render={({ field }) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Estado Financiero</label>
                <select {...field} disabled={isSaving} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="AL_CORRIENTE">Al Corriente</option>
                  <option value="MOROSO">Moroso</option>
                </select>
              </div>
            )}
          />
        </div>

        <Controller
          name="esIngresoTardio"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input 
                type="checkbox" 
                id="tardio-chk"
                checked={value} 
                onChange={(e) => onChange(e.target.checked)} 
                disabled={isSaving} 
              />
              <label htmlFor="tardio-chk" style={{ fontSize: '14px', fontWeight: 500 }}>Es Ingreso Tardío (Inscrito posterior al arranque normal)</label>
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
