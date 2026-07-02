import { useNavigate } from 'react-router-dom';
import { Plus, Edit2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import styles from './UsuariosListPage.module.css';

// Tipo inferido del backend (idealmente importarlo si estuviera disponible en el front)
type UsuarioRow = {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  roles: { rol: { nombre: string } }[];
  activo: boolean;
};

export function UsuariosListPage() {
  const navigate = useNavigate();
  // El router en el back devuelve algo similar a { usuarios: [...], total: ... }
  const { data, isLoading } = trpc.usuarios.listarUsuarios.useQuery({
    pagina: 1,
    limite: 50
  });

  const columns: Column<UsuarioRow>[] = [
    {
      header: 'Nombre',
      accessor: 'nombreCompleto',
    },
    {
      header: 'Correo Electrónico',
      accessor: 'correo',
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
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/usuarios/${row.usuarioId}/editar`);
          }}
        >
          <Edit2 size={16} />
        </Button>
      ),
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuarios del Sistema</h1>
          <p className={styles.subtitle}>Gestiona el acceso y permisos del personal.</p>
        </div>
        <Button onClick={() => navigate('/usuarios/nuevo')} leftIcon={<Plus size={18} />}>
          Nuevo Usuario
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<UsuarioRow>
            columns={columns}
            data={(data?.data as unknown as UsuarioRow[]) || []}
            keyExtractor={(row) => row.usuarioId}
            onRowClick={(row) => navigate(`/usuarios/${row.usuarioId}`)}
          />
        )}
      </div>
    </div>
  );
}
