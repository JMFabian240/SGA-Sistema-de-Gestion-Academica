import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useEffect } from 'react';

const schema = z.object({
  nombreCompleto: z.string().min(10, 'El nombre completo debe tener al menos 10 caracteres').max(120),
  nombreUsuario: z.string().min(4, 'El usuario debe tener al menos 4 caracteres').max(80),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(50),
  rolId: z.number().min(1, 'El rol es requerido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (usuarioId: number, nombreCompleto: string) => void;
};

export function CrearDocenteRapidoModal({ isOpen, onClose, onSuccess }: Props) {
  const { data: roles = [], isLoading: isLoadingRoles } = trpc.usuarios.getRoles.useQuery(undefined, { enabled: isOpen });

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombreCompleto: '', nombreUsuario: '', password: '', rolId: 0 },
  });

  // Buscar el rol de docente y asignarlo por defecto
  useEffect(() => {
    if (roles.length > 0) {
      const docenteRol = roles.find(r => r.nombre.toUpperCase() === 'DOCENTE' || r.nombre.toUpperCase() === 'DOCENTES');
      if (docenteRol) {
        setValue('rolId', docenteRol.rolId);
      }
    }
  }, [roles, setValue]);

  const createMutation = trpc.usuarios.crearUsuario.useMutation({
    onSuccess: (data, variables) => {
      reset();
      onSuccess(data.usuarioId, variables.nombreCompleto);
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const isSaving = createMutation.isPending;
  const docenteRolAsignado = roles.find(r => r.nombre.toUpperCase() === 'DOCENTE' || r.nombre.toUpperCase() === 'DOCENTES');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Docente"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="nombreCompleto"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
              <input
                {...field}
                type="text"
                disabled={isSaving}
                placeholder="Ej. Juan Pérez Gómez"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              />
              {errors.nombreCompleto && <span className="text-xs text-red-600">{errors.nombreCompleto.message}</span>}
            </div>
          )}
        />

        <Controller
          name="nombreUsuario"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nombre de Usuario (Para Iniciar Sesión)</label>
              <input
                {...field}
                type="text"
                disabled={isSaving}
                placeholder="Ej. juan.perez"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              />
              {errors.nombreUsuario && <span className="text-xs text-red-600">{errors.nombreUsuario.message}</span>}
            </div>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Contraseña Temporal</label>
              <input
                {...field}
                type="password"
                disabled={isSaving}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm bg-white"
              />
              {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
            </div>
          )}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Rol asignado</label>
          <input
            type="text"
            disabled
            value={isLoadingRoles ? 'Cargando roles...' : docenteRolAsignado ? docenteRolAsignado.nombre : 'DOCENTE'}
            className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm"
          />
          <span className="text-[10px] text-gray-400">Este campo está bloqueado en modo de creación rápida.</span>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isLoadingRoles || !docenteRolAsignado}>
            Crear Docente
          </Button>
        </div>
      </form>
    </Modal>
  );
}
