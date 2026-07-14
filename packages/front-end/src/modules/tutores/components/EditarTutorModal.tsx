import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';

const editarTutorSchema = z.object({
  nombreCompleto: z.string().min(1, 'Obligatorio').max(120),
  correoElectronico: z.string().email('Correo inválido').max(255).optional().or(z.literal('')),
  telefono: z.string().max(15).optional(),
  direccion: z.string().optional(),
  curp: z.string().max(18).optional().or(z.literal('')),
  requiereFactura: z.boolean().default(false),
  
  rfc: z.string().max(13).optional().or(z.literal('')),
  razonSocial: z.string().max(120).optional().or(z.literal('')),
  regimenFiscal: z.string().max(10).optional().or(z.literal('')),
  usoCfdi: z.string().max(10).optional().or(z.literal('')),
  direccionFiscal: z.string().optional().or(z.literal('')),
  codigoPostal: z.string().max(10).optional().or(z.literal('')),
  correoFacturacion: z.string().email('Correo inválido').max(255).optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  if (data.requiereFactura) {
    if (!data.rfc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rfc'], message: 'El RFC es obligatorio' });
    }
    if (!data.razonSocial) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['razonSocial'], message: 'La Razón Social es obligatoria' });
    }
  }
});

type EditarTutorForm = z.infer<typeof editarTutorSchema>;

interface EditarTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: any;
}

export function EditarTutorModal({ isOpen, onClose, tutor }: EditarTutorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<EditarTutorForm>({
    resolver: zodResolver(editarTutorSchema),
    defaultValues: {
      nombreCompleto: '',
      correoElectronico: '',
      telefono: '',
      direccion: '',
      curp: '',
      requiereFactura: false,
      rfc: '',
      razonSocial: '',
      regimenFiscal: '',
      usoCfdi: '',
      direccionFiscal: '',
      codigoPostal: '',
      correoFacturacion: ''
    }
  });

  const watchRequiereFactura = watch('requiereFactura');
  const updateTutorMutation = trpc.tutores.update.useMutation();

  useEffect(() => {
    if (isOpen && tutor) {
      reset({
        nombreCompleto: tutor.nombreCompleto || '',
        correoElectronico: tutor.correoElectronico || '',
        telefono: tutor.telefono || '',
        direccion: tutor.direccion || '',
        curp: tutor.curp || '',
        requiereFactura: tutor.datosFiscales ? true : false,
        rfc: tutor.datosFiscales?.rfc || '',
        razonSocial: tutor.datosFiscales?.razonSocial || '',
        regimenFiscal: tutor.datosFiscales?.regimenFiscal || '',
        usoCfdi: tutor.datosFiscales?.usoCfdi || '',
        direccionFiscal: tutor.datosFiscales?.direccionFiscal || '',
        codigoPostal: tutor.datosFiscales?.codigoPostal || '',
        correoFacturacion: tutor.datosFiscales?.correoFacturacion || ''
      });
      setSubmitError(null);
    }
  }, [isOpen, tutor, reset]);

  if (!isOpen || !tutor) return null;

  const onSubmit = async (data: EditarTutorForm) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload: any = {
        tutorId: tutor.tutorId,
        nombreCompleto: data.nombreCompleto,
        correoElectronico: data.correoElectronico || undefined,
        telefono: data.telefono || undefined,
        direccion: data.direccion || undefined,
        curp: data.curp || undefined,
        requiereFactura: data.requiereFactura
      };

      if (data.requiereFactura) {
        payload.datosFiscales = {
          rfc: data.rfc!,
          razonSocial: data.razonSocial!,
          regimenFiscal: data.regimenFiscal || undefined,
          usoCfdi: data.usoCfdi || undefined,
          direccionFiscal: data.direccionFiscal || undefined,
          codigoPostal: data.codigoPostal || undefined,
          correoFacturacion: data.correoFacturacion || undefined
        };
      }

      await updateTutorMutation.mutateAsync(payload);
      utils.tutores.getAll.invalidate();
      onClose();
    } catch (error: any) {
      setSubmitError(error.message || 'Error al actualizar el tutor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Editar Padre de Familia</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {submitError}
            </div>
          )}

          <form id="editarTutorForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sección General */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    {...register('nombreCompleto')}
                    className={`w-full px-3 py-2 rounded-xl border ${errors.nombreCompleto ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20'} focus:outline-none focus:ring-2`}
                  />
                  {errors.nombreCompleto && <span className="text-xs text-red-500 mt-1">{errors.nombreCompleto.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CURP</label>
                  <input
                    {...register('curp')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="18 caracteres"
                  />
                  {errors.curp && <span className="text-xs text-red-500 mt-1">{errors.curp.message}</span>}
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    {...register('telefono')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    {...register('correoElectronico')}
                    className={`w-full px-3 py-2 rounded-xl border ${errors.correoElectronico ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                  {errors.correoElectronico && <span className="text-xs text-red-500 mt-1">{errors.correoElectronico.message}</span>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
                  <input
                    {...register('direccion')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Sección de Facturación */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Datos de Facturación</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    {...register('requiereFactura')}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requiere Factura</span>
                </label>
              </div>

              {watchRequiereFactura && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                    <input
                      {...register('razonSocial')}
                      className={`w-full px-3 py-2 rounded-xl border ${errors.razonSocial ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                    {errors.razonSocial && <span className="text-xs text-red-500 mt-1">{errors.razonSocial.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFC *</label>
                    <input
                      {...register('rfc')}
                      className={`w-full px-3 py-2 rounded-xl border ${errors.rfc ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                    {errors.rfc && <span className="text-xs text-red-500 mt-1">{errors.rfc.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                    <input
                      {...register('codigoPostal')}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Régimen Fiscal</label>
                    <input
                      {...register('regimenFiscal')}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Ej. 601"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uso de CFDI</label>
                    <input
                      {...register('usoCfdi')}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Ej. G03"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                    <input
                      {...register('direccionFiscal')}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="editarTutorForm"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
