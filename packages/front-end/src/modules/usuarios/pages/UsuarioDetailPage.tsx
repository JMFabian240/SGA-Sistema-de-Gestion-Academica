import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Shield, User, Save } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';

export const MODULOS_SISTEMA = [
  'Usuarios',
  'Alumnos',
  'Tutores',
  'Grupos',
  'Materias',
  'Pagos',
  'Becas',
  'Reportes',
  'Configuracion'
] as const;

export function UsuarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const usuarioId = Number(id);

  const { data: usuario, isLoading, refetch } = trpc.usuarios.obtenerUsuarioDetalle.useQuery(usuarioId, {
    enabled: !!usuarioId,
  });

  const updatePasswordMutation = trpc.usuarios.actualizarPasswordUsuario.useMutation();
  const updatePermisosMutation = trpc.usuarios.sincronizarPermisosModulo.useMutation();
  const updateEstadoMutation = trpc.usuarios.actualizarEstadoUsuario.useMutation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [permisos, setPermisos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (usuario?.permisosModulos) {
      const perms: Record<string, string> = {};
      MODULOS_SISTEMA.forEach(mod => {
        const found = usuario.permisosModulos.find((p: any) => p.modulo === mod);
        perms[mod] = found ? found.nivel : 'DENEGADO';
      });
      setPermisos(perms);
    }
  }, [usuario]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        usuarioId,
        nuevaPassword: newPassword
      });
      setNewPassword('');
      setConfirmPassword('');
      alert('Contraseña actualizada exitosamente');
    } catch (error: any) {
      setPasswordError(error.message || 'Error al actualizar contraseña');
    }
  };

  const handleUpdatePermisos = async () => {
    const permisosArray = Object.entries(permisos).map(([modulo, nivel]) => ({
      modulo: modulo as any,
      nivel: nivel as any
    }));

    try {
      await updatePermisosMutation.mutateAsync({
        usuarioId,
        permisos: permisosArray
      });
      alert('Permisos sincronizados correctamente');
      refetch();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar permisos');
    }
  };

  const handleToggleEstado = async () => {
    if (!usuario) return;
    
    if (confirm(`¿Estás seguro de que deseas ${usuario.activo ? 'desactivar' : 'activar'} a este usuario?`)) {
      try {
        await updateEstadoMutation.mutateAsync({
          usuarioId,
          activo: !usuario.activo
        });
        refetch();
      } catch (error: any) {
        alert(error.message || 'Error al actualizar el estado');
      }
    }
  };

  if (isLoading) return <Spinner centered size={40} />;
  if (!usuario) return <div className="p-8 text-center text-gray-500">Usuario no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/usuarios')}
          className="p-2 text-gray-400 hover:text-navy-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Ficha del Usuario</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de cuenta y permisos granulares</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Información y Contraseña */}
        <div className="space-y-6">
          {/* Info Basica */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
            <div className="absolute top-6 right-6">
              <Button 
                variant={usuario.activo ? 'danger' : 'success'} 
                size="sm" 
                onClick={handleToggleEstado}
                disabled={updateEstadoMutation.isPending}
              >
                {usuario.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
              </Button>
            </div>
            
            <div className="flex items-center gap-3 mb-6 pr-32">
              <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center text-navy-600">
                <User size={24} />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-gray-900">{usuario.nombreCompleto}</h2>
                <div className="flex items-center gap-3">
                  <Badge variant={usuario.activo ? 'success' : 'danger'}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Usuario</p>
                <p className="text-sm font-medium text-gray-900">{usuario.nombreUsuario}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Roles Globales</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {usuario.roles.length === 0 && <span className="text-sm text-gray-500">Sin roles</span>}
                  {usuario.roles.map((ur: any) => (
                    <Badge key={ur.rol.rolId} variant="warning">{ur.rol.nombre}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cambio de contraseña */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="text-navy-600" size={20} />
              <h2 className="text-lg font-semibold text-navy-800">Actualizar Contraseña</h2>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                type="password"
                label="Nueva Contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <Input
                type="password"
                label="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updatePasswordMutation.isPending}>
                  {updatePasswordMutation.isPending ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Permisos */}
        <div className="space-y-6">
          
          {/* Permisos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-navy-600" size={20} />
              <h2 className="text-lg font-semibold text-navy-800">Permisos por Módulo</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">Configura el nivel de acceso granular que este usuario tendrá sobre los diferentes módulos del sistema.</p>
            
            <div className="space-y-4 border-t border-gray-100 pt-4">
              {MODULOS_SISTEMA.map(modulo => (
                <div key={modulo} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{modulo}</span>
                  <select
                    className="rounded-lg border border-gray-200 focus:ring-2 focus:ring-navy-500 px-3 py-1.5 text-sm bg-white outline-none w-48"
                    value={permisos[modulo] || 'DENEGADO'}
                    onChange={(e) => setPermisos({ ...permisos, [modulo]: e.target.value })}
                  >
                    <option value="DENEGADO">Denegado</option>
                    <option value="LECTURA">Solo Lectura</option>
                    <option value="LECTURA_Y_ESCRITURA">Lectura y Escritura</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleUpdatePermisos} leftIcon={<Save size={16} />} disabled={updatePermisosMutation.isPending}>
                Guardar Permisos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
