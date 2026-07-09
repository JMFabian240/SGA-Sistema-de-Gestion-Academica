import React, { useState } from 'react';
import { UserPlus, Save, Loader2, X } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface UsuarioCrearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UsuarioCrearModal({ isOpen, onClose, onSuccess }: UsuarioCrearModalProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: roles } = trpc.usuarios.getRoles.useQuery(undefined, { enabled: isOpen });
  const utils = trpc.useUtils();
  
  const crearMutation = trpc.usuarios.crearUsuario.useMutation({
    onSuccess: () => {
      utils.usuarios.listarUsuarios.invalidate();
      alert('Usuario creado exitosamente');
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error al crear usuario');
    }
  });

  const handleClose = () => {
    setNombreCompleto('');
    setNombreUsuario('');
    setPassword('');
    setRolId(0);
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!rolId) {
      setErrorMsg('Debe seleccionar un rol');
      return;
    }
    
    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    crearMutation.mutate({
      nombreCompleto,
      nombreUsuario,
      password,
      rolId
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-navy-800">
            <UserPlus size={20} className="text-navy-600" />
            <h2 className="text-lg font-semibold">Crear Nuevo Usuario</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="crear-usuario-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Nombre Completo"
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Juan Pérez García"
                  required
                />
              </div>
              
              <Input
                label="Nombre de Usuario"
                type="text"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Identificador para inicio de sesión"
                required
              />
              
              <Input
                label="Contraseña (temporal)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol a Asignar
              </label>
              <select
                className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 px-4 py-3 outline-none transition-colors bg-white"
                value={rolId}
                onChange={(e) => setRolId(Number(e.target.value))}
                required
              >
                <option value={0} disabled>Seleccione un rol...</option>
                {roles?.map((rol: any) => (
                  <option key={rol.rolId} value={rol.rolId}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                El rol determinará los módulos a los que el usuario tiene acceso por defecto.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Nota:</span> Al ser creado, este usuario tendrá que cambiar obligatoriamente su contraseña en su primer inicio de sesión.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {errorMsg}
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={crearMutation.isPending}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="crear-usuario-form"
            disabled={crearMutation.isPending || !rolId || !nombreCompleto || !nombreUsuario || !password}
            leftIcon={crearMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          >
            {crearMutation.isPending ? 'Guardando...' : 'Guardar Usuario'}
          </Button>
        </div>
      </div>
    </div>
  );
}
