import { useEffect, useState } from 'react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Shield, X, Save } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './RolesModal.module.css';

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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.title}>
            <Shield size={20} className="text-primary" />
            <h2>Asignar Roles</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.subtitle}>
            Gestionando roles para el usuario: <strong>{nombreUsuario}</strong>
          </p>

          {isLoading ? (
            <div className="text-center text-secondary py-4">Cargando roles...</div>
          ) : (
            <div className={styles.rolesList}>
              {roles?.map((rol: any) => (
                <label
                  key={rol.rolId}
                  className={clsx(styles.rolItem, selectedRoles.includes(rol.rolId) && styles.rolItemSelected)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(rol.rolId)}
                    onChange={() => toggleRol(rol.rolId)}
                    className={styles.checkbox}
                  />
                  <div className={styles.rolInfo}>
                    <span className={styles.rolName}>{rol.nombre}</span>
                    {rol.descripcion && (
                      <span className={styles.rolDesc}>{rol.descripcion}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={asignarRolesMutation.isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={asignarRolesMutation.isLoading}>
            <Save size={16} />
            {asignarRolesMutation.isLoading ? 'Guardando...' : 'Guardar Roles'}
          </Button>
        </div>
      </div>
    </div>
  );
}
