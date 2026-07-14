import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Shield, Search } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { Table, type Column } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { RolesModal } from '../components/RolesModal';
import { UsuarioCrearModal } from '../components/UsuarioCrearModal';

type UsuarioRow = {
  usuarioId: number;
  nombreCompleto: string;
  nombreUsuario: string;
  roles: { rolId: number, rol: { nombre: string } }[];
  activo: boolean;
};

export function UsuariosListPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = trpc.usuarios.listarUsuarios.useQuery({
    pagina: 1,
    limite: 50
  });
  const { data: roles } = trpc.usuarios.getRoles.useQuery();

  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<{ id: number, nombre: string, roles: number[] } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'activo' | 'inactivo' | 'ambos'>('activo');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  const usuariosRaw = (data?.data as unknown as UsuarioRow[]) || [];

  const usuariosFiltrados = usuariosRaw.filter((usuario) => {
    if (statusFilter === 'activo' && !usuario.activo) return false;
    if (statusFilter === 'inactivo' && usuario.activo) return false;

    if (roleFilter !== 'todos') {
      const hasRole = usuario.roles?.some(r => r.rolId.toString() === roleFilter);
      if (!hasRole) return false;
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchName = usuario.nombreCompleto.toLowerCase().includes(term);
      if (!matchName) return false;
    }

    return true;
  });

  const handleOpenRoles = (row: UsuarioRow) => {
    setSelectedUserForRoles({
      id: row.usuarioId,
      nombre: row.nombreCompleto,
      roles: row.roles?.map(r => r.rolId) || []
    });
    setRolesModalOpen(true);
  };

  const columns: Column<UsuarioRow>[] = [
    {
      header: 'Nombre',
      accessor: 'nombreCompleto',
    },
    {
      header: 'Rol',
      accessor: (row) => row.roles?.[0]?.rol?.nombre || 'Sin Rol',
    },
    {
      header: 'Estado',
      accessor: (row) => (
        <Badge variant={row.activo ? 'success' : 'danger'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            title="Gestionar Roles"
            onClick={() => handleOpenRoles(row)}
            className="text-navy-600 hover:bg-navy-50 rounded-lg px-2 py-1.5 h-auto"
          >
            <Shield size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Editar Usuario"
            onClick={() => navigate(`/usuarios/${row.usuarioId}`)}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-2 py-1.5 h-auto"
          >
            <Edit2 size={16} />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Usuarios del Sistema</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona el acceso y permisos del personal.</p>
        </div>
        <Button
          variant="cta"
          onClick={() => setCrearModalOpen(true)}
          leftIcon={<Plus size={18} />}
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-end gap-4">
        {/* Buscador */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar usuario</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 pl-10 pr-3 py-2 sm:text-sm outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filtro Rol */}
        <div className="w-full sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select
            className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 px-3 py-2 sm:text-sm outline-none transition-colors bg-white cursor-pointer"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            {roles?.map((rol: any) => (
              <option key={rol.rolId} value={rol.rolId.toString()}>{rol.nombre}</option>
            ))}
          </select>
        </div>

        {/* Filtro Estado */}
        <div className="w-full sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            className="block w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500 px-3 py-2 sm:text-sm outline-none transition-colors bg-white cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-500 font-medium px-1">
        Total de usuarios: {usuariosFiltrados.length}
      </div>

      <div className="w-full">
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<UsuarioRow>
            columns={columns}
            data={usuariosFiltrados}
            keyExtractor={(row) => row.usuarioId}
            onRowClick={(row) => navigate(`/usuarios/${row.usuarioId}`)}
          />
        )}
      </div>

      {selectedUserForRoles && (
        <RolesModal
          isOpen={rolesModalOpen}
          onClose={() => setRolesModalOpen(false)}
          usuarioId={selectedUserForRoles.id}
          nombreUsuario={selectedUserForRoles.nombre}
          rolesActuales={selectedUserForRoles.roles}
          onSuccess={() => refetch()}
        />
      )}

      <UsuarioCrearModal
        isOpen={crearModalOpen}
        onClose={() => setCrearModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
