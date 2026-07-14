import { useEffect, useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { Shield, X, Save } from 'lucide-react';
import { clsx } from 'clsx';

interface RolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: number;
  nombreUsuario: string;
  rolesActuales: number[];
  onSuccess?: () => void;
}

export function RolesModal({ isOpen, onClose, usuarioId, nombreUsuario, rolesActuales, onSuccess }: RolesModalProps) {
  const { data: roles, isLoading } = trpc.usuarios.getRoles.useQuery(undefined, {
    enabled: isOpen,
  });

  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedRoles(rolesActuales);
    }
  }, [isOpen, rolesActuales]);

  const asignarRolesMutation = trpc.usuarios.asignarRoles.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    }
  });

  const toggleRol = (rolId: number) => {
    setSelectedRoles(prev =>
      prev.includes(rolId)
        ? prev.filter(id => id !== rolId)
        : [...prev, rolId]
    );
  };

  const handleSave = () => {
    if (selectedRoles.length === 0) {
      alert("El usuario debe tener al menos un rol asignado.");
      return;
    }
    asignarRolesMutation.mutate({ usuarioId, roles: selectedRoles });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-navy-800">
            <Shield size={20} className="text-navy-600" />
            <h2 className="text-lg font-semibold">Asignar Roles</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4">
            Gestionando roles para el usuario: <strong className="text-gray-900">{nombreUsuario}</strong>
          </p>

          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Cargando roles...</div>
          ) : (
            <div className="space-y-2">
              {roles?.map((rol: any) => (
                <label
                  key={rol.rolId}
                  className={clsx(
                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                    selectedRoles.includes(rol.rolId) 
                      ? "bg-navy-50 border-navy-200" 
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(rol.rolId)}
                    onChange={() => toggleRol(rol.rolId)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{rol.nombre}</span>
                    {rol.descripcion && (
                      <span className="text-xs text-gray-500">{rol.descripcion}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={asignarRolesMutation.isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={asignarRolesMutation.isLoading} leftIcon={<Save size={16} />}>
            {asignarRolesMutation.isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
