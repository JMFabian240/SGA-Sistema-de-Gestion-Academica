import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import { useState } from 'react';

const formSchema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido').max(120),
  telefono: z.string().max(15).optional(),
  correoElectronico: z.string().email('Correo inválido').or(z.literal('')).optional(),
  rfc: z.string().optional(),
  curp: z.string().max(18).optional(),
  direccion: z.string().optional(),
  requiereFactura: z.boolean().default(false),

  // Datos fiscales
  razonSocial: z.string().optional(),
  regimenFiscal: z.string().max(10).optional(),
  usoCfdi: z.string().max(10).optional(),
  direccionFiscal: z.string().optional(),
  codigoPostal: z.string().max(10).optional(),
  correoFacturacion: z.string().email('Correo inválido').or(z.literal('')).optional(),
}).superRefine((data, ctx) => {
  if (data.requiereFactura) {
    if (!data.rfc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerido para factura', path: ['rfc'] });
    } else if (data.rfc.length > 13) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Máximo 13 caracteres', path: ['rfc'] });
    }

    if (!data.razonSocial) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerida para factura', path: ['razonSocial'] });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

interface NuevoTutorModalProps {
  isOpen: boolean;
  alumnoId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function NuevoTutorModal({ isOpen, alumnoId, onClose, onSuccess }: NuevoTutorModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const createTutorMutation = trpc.tutores.create.useMutation();
  const linkTutorMutation = trpc.alumnos.linkTutor.useMutation();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      requiereFactura: false
    }
  });

  const requiereFactura = watch('requiereFactura');

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitError(null);

      const payload: any = {
        nombreCompleto: data.nombreCompleto,
        telefono: data.telefono || undefined,
        correoElectronico: data.correoElectronico || undefined,
        curp: data.curp || undefined,
        direccion: data.direccion || undefined,
        requiereFactura: data.requiereFactura,
      };

      if (data.requiereFactura) {
        payload.datosFiscales = {
          rfc: data.rfc!,
          razonSocial: data.razonSocial!,
          regimenFiscal: data.regimenFiscal || undefined,
          usoCfdi: data.usoCfdi || undefined,
          direccionFiscal: data.direccionFiscal || undefined,
          codigoPostal: data.codigoPostal || undefined,
          correoFacturacion: data.correoFacturacion || undefined,
        };
      }

      // 1. Crear tutor
      const newTutor = await createTutorMutation.mutateAsync(payload);

      // 2. Vincular tutor al alumno actual (solo si hay alumnoId)
      if (alumnoId) {
        await linkTutorMutation.mutateAsync({
          alumnoId,
          tutorId: newTutor.tutorId,
          esPrincipal: true,
          parentesco: 'Tutor' // Valor fijo solicitado
        });
      }

      utils.tutores.getAll.invalidate();
      onSuccess();
    } catch (error: any) {
      setSubmitError(error.message || 'Error al guardar el tutor');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Tutor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              {submitError}
            </div>
          )}

          <form id="tutor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                <input
                  {...register('nombreCompleto')}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.nombreCompleto ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} outline-none focus:ring-2 transition-all`}
                />
                {errors.nombreCompleto && <span className="text-xs text-red-500 mt-1 block">{errors.nombreCompleto.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  {...register('telefono')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  {...register('correoElectronico')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                <input
                  {...register('rfc')}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.rfc ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} outline-none focus:ring-2 transition-all uppercase`}
                />
                {errors.rfc && <span className="text-xs text-red-500 mt-1 block">{errors.rfc.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CURP</label>
                <input
                  {...register('curp')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all uppercase"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  {...register('direccion')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requiereFactura')}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Requiere Factura</span>
              </label>
            </div>

            {requiereFactura && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social <span className="text-red-500">*</span></label>
                  <input
                    {...register('razonSocial')}
                    className={`w-full px-4 py-2 rounded-xl border ${errors.razonSocial ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} outline-none focus:ring-2 transition-all`}
                  />
                  {errors.razonSocial && <span className="text-xs text-red-500 mt-1 block">{errors.razonSocial.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Régimen Fiscal</label>
                  <input
                    {...register('regimenFiscal')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uso CFDI</label>
                  <input
                    {...register('usoCfdi')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                  <input
                    {...register('direccionFiscal')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                  <input
                    {...register('codigoPostal')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo de Facturación</label>
                  <input
                    type="email"
                    {...register('correoFacturacion')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="tutor-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#001c40] text-white font-medium rounded-xl hover:bg-[#00132b] transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Registrar Tutor'}
          </button>
        </div>
      </div>
    </div>
  );
}
