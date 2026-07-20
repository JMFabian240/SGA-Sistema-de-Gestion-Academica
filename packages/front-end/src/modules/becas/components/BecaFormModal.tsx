import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';

const CriterioBecaEnum = z.enum([
  'ACADEMICA', 'SOCIOECONOMICA', 'DEPORTIVA', 
  'CULTURAL', 'POR_HERMANOS', 'PROMOCION_TEMPRANA', 'EXTERNA'
]);

const becaSchema = z.object({
  nombreBeca: z.string().min(1, 'El nombre es requerido').max(60, 'Máximo 60 caracteres'),
  criterio: CriterioBecaEnum,
  porcentaje: z.number({ invalid_type_error: 'Debe ser un número' }).positive('Debe ser mayor a 0').max(100, 'Máximo 100%'),
  descripcion: z.string().optional()
});

type BecaFormData = z.infer<typeof becaSchema>;

interface BecaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BecaFormData) => void;
  initialData?: BecaFormData | null;
  isLoading?: boolean;
}

export function BecaFormModal({ isOpen, onClose, onSubmit, initialData, isLoading }: BecaFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BecaFormData>({
    resolver: zodResolver(becaSchema),
    defaultValues: {
      nombreBeca: '',
      criterio: 'ACADEMICA',
      porcentaje: 0,
      descripcion: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({
          nombreBeca: '',
          criterio: 'ACADEMICA',
          porcentaje: 0,
          descripcion: ''
        });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Editar Beca' : 'Nueva Beca'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nombre de la Beca
            </label>
            <input
              {...register('nombreBeca')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Ej. Beca Excelencia 50%"
            />
            {errors.nombreBeca && <p className="text-red-500 text-xs mt-1">{errors.nombreBeca.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Criterio
              </label>
              <select
                {...register('criterio')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="ACADEMICA">Académica</option>
                <option value="SOCIOECONOMICA">Socioeconómica</option>
                <option value="DEPORTIVA">Deportiva</option>
                <option value="CULTURAL">Cultural</option>
                <option value="POR_HERMANOS">Por Hermanos</option>
                <option value="PROMOCION_TEMPRANA">Promoción Temprana</option>
                <option value="EXTERNA">Externa</option>
              </select>
              {errors.criterio && <p className="text-red-500 text-xs mt-1">{errors.criterio.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Porcentaje (%)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('porcentaje', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="50"
              />
              {errors.porcentaje && <p className="text-red-500 text-xs mt-1">{errors.porcentaje.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Descripción (Opcional)
            </label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              placeholder="Detalles adicionales sobre la beca..."
            />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#001429] text-white rounded-xl text-sm font-semibold hover:bg-[#001f3f] transition-colors disabled:opacity-70"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {initialData ? 'Guardar Cambios' : 'Crear Beca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
