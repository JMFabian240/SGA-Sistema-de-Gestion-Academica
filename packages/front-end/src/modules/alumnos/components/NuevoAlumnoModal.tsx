import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';

const nuevoAlumnoSchema = z.object({
  nombreCompleto: z.string().min(1, 'Obligatorio'),
  fechaNacimiento: z.string().min(1, 'Obligatorio'),
  sexo: z.string().min(1, 'Obligatorio'),
  matricula: z.string().min(1, 'Obligatorio'),
  curp: z.string().length(18, 'Debe ser de 18 caracteres').optional().or(z.literal('')),
  nivelId: z.string().min(1, 'Obligatorio'),
  gradoId: z.string().min(1, 'Obligatorio'),
  seccionId: z.string().min(1, 'Obligatorio'),
  planPagoId: z.string().optional()
});

type NuevoAlumnoForm = z.infer<typeof nuevoAlumnoSchema>;

interface NuevoAlumnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (alumnoId: number) => void;
}

export function NuevoAlumnoModal({ isOpen, onClose, onSuccess }: NuevoAlumnoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<NuevoAlumnoForm>({
    resolver: zodResolver(nuevoAlumnoSchema),
    defaultValues: {
      nombreCompleto: '',
      fechaNacimiento: '',
      sexo: '',
      matricula: '',
      curp: '',
      nivelId: '',
      gradoId: '',
      seccionId: '',
      planPagoId: ''
    }
  });

  const { data: niveles } = trpc.grupos.getNiveles.useQuery(undefined, { enabled: isOpen });
  const { data: grados } = trpc.grupos.getGrados.useQuery(undefined, { enabled: isOpen });
  const { data: grupos } = trpc.grupos.getGrupos.useQuery(undefined, { enabled: isOpen });
  const { data: planesPago } = trpc.inscripciones.getPlanesPago.useQuery(undefined, { enabled: isOpen });
  const createAlumnoMutation = trpc.alumnos.create.useMutation();

  const watchNivelId = watch('nivelId');
  const watchGradoId = watch('gradoId');
  const gradosFiltrados = grados?.filter(g => g.nivelId.toString() === watchNivelId);
  const gruposFiltrados = grupos?.filter(g => g.gradoId.toString() === watchGradoId && g.nivelId.toString() === watchNivelId);

  useEffect(() => {
    if (isOpen) {
      reset();
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: NuevoAlumnoForm) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const newAlumno = await createAlumnoMutation.mutateAsync({
        nombreCompleto: data.nombreCompleto,
        matricula: data.matricula,
        curp: data.curp || undefined,
        fechaNacimiento: new Date(data.fechaNacimiento).toISOString(),
        sexo: data.sexo,
        nivelId: parseInt(data.nivelId, 10),
        gradoId: data.gradoId ? parseInt(data.gradoId, 10) : undefined,
        grupoId: data.seccionId ? parseInt(data.seccionId, 10) : undefined,
        planPagoId: data.planPagoId ? parseInt(data.planPagoId, 10) : undefined,
        estado: 'ACTIVO'
      });

      onSuccess(newAlumno.alumnoId);
    } catch (error: any) {
      setSubmitError(error.message || 'Error al guardar el alumno');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Alumno</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {submitError}
            </div>
          )}

          <form id="alumno-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Nombre Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-600 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...register('nombreCompleto')}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.nombreCompleto ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm uppercase`}
                />
                {errors.nombreCompleto && <span className="text-xs text-red-500 mt-1">{errors.nombreCompleto.message}</span>}
              </div>
            </div>

            {/* Fecha & Genero Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha de Nac. <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="date"
                    {...register('fechaNacimiento')}
                    className={`w-full px-3 py-2 rounded-xl border ${errors.fechaNacimiento ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm appearance-none`}
                  />
                  <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                </div>
                {errors.fechaNacimiento && <span className="text-xs text-red-500 mt-1">{errors.fechaNacimiento.message}</span>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Género <span className="text-red-500">*</span></label>
                <select
                  {...register('sexo')}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.sexo ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm bg-white`}
                >
                  <option value="">Seleccione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {errors.sexo && <span className="text-xs text-red-500 mt-1">{errors.sexo.message}</span>}
              </div>
            </div>



            {/* Matricula y CURP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Matrícula <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...register('matricula')}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.matricula ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm uppercase`}
                />
                {errors.matricula && <span className="text-xs text-red-500 mt-1">{errors.matricula.message}</span>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">CURP</label>
                <input
                  type="text"
                  {...register('curp')}
                  maxLength={18}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.curp ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm uppercase`}
                />
                {errors.curp && <span className="text-xs text-red-500 mt-1">{errors.curp.message}</span>}
              </div>
            </div>

            {/* Nivel, Grado, Seccion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nivel <span className="text-red-500">*</span></label>
                <select
                  {...register('nivelId')}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.nivelId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm bg-white`}
                >
                  <option value="">Selecciona Niv...</option>
                  {niveles?.map(n => (
                    <option key={n.nivelId} value={n.nivelId.toString()}>{n.nombre}</option>
                  ))}
                </select>
                {errors.nivelId && <span className="text-xs text-red-500 mt-1">{errors.nivelId.message}</span>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Grado <span className="text-red-500">*</span></label>
                <select
                  {...register('gradoId')}
                  disabled={!watchNivelId}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.gradoId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm bg-white disabled:opacity-50`}
                >
                  <option value="">Selecciona Gra...</option>
                  {gradosFiltrados?.map(g => (
                    <option key={g.gradoId} value={g.gradoId.toString()}>{g.nombre}</option>
                  ))}
                </select>
                {errors.gradoId && <span className="text-xs text-red-500 mt-1">{errors.gradoId.message}</span>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Grupo <span className="text-red-500">*</span></label>
                <select
                  {...register('seccionId')}
                  disabled={!watchGradoId}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.seccionId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} focus:ring-2 focus:ring-opacity-20 outline-none text-sm bg-white disabled:opacity-50`}
                >
                  <option value="">Selecciona Sec...</option>
                  {gruposFiltrados?.map(g => (
                    <option key={g.grupoId} value={g.grupoId.toString()}>{g.nombre}</option>
                  ))}
                </select>
                {errors.seccionId && <span className="text-xs text-red-500 mt-1">{errors.seccionId.message}</span>}
              </div>
            </div>

            {/* Plan de Pago (Opcional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Plan de Pagos (Opcional)</label>
                <select
                  {...register('planPagoId')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none text-sm bg-white"
                >
                  <option value="">Selecciona un plan (opcional)</option>
                  {planesPago?.map(p => (
                    <option key={p.planPagoId} value={p.planPagoId.toString()}>{p.nombre} ({p.meses} meses)</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Se generará la deuda automáticamente si lo seleccionas.</p>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="alumno-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#001c40] text-white font-medium hover:bg-[#00132b] transition-colors text-sm shadow-sm disabled:opacity-70 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Alumno'}
          </button>
        </div>

      </div>
    </div>
  );
}
