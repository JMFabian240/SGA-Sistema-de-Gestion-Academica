import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { CicloFormModal } from '../../components/CicloFormModal/CicloFormModal';
import styles from '../NivelesListPage/NivelesListPage.module.css'; // Reutiliza los estilos genéricos

type CicloRow = {
  cicloId: number;
  nombre: string;
  fechaInicio: string; // En el client se suele manejar como string ISO por TRPC Date serialization si está config. o string normal
  fechaFin: string;
  activo: boolean;
};

export function CiclosListPage() {
  const { data: ciclos, isLoading } = trpc.grupos.getCiclos.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.grupos.deleteCiclo.useMutation({
    onSuccess: () => utils.grupos.getCiclos.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<CicloRow | null>(null);

  const handleOpenNew = () => {
    setEditingCiclo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: CicloRow) => {
    setEditingCiclo(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar este ciclo?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<CicloRow>[] = [
    { header: 'ID', accessor: 'cicloId' },
    { header: 'Nombre', accessor: 'nombre' },
    {
      header: 'Inicio',
      accessor: (row) => new Date(row.fechaInicio).toLocaleDateString()
    },
    {
      header: 'Fin',
      accessor: (row) => new Date(row.fechaFin).toLocaleDateString()
    },
    {
      header: 'Estado',
      accessor: (row) => (
        <Badge variant={row.activo ? 'success' : 'default'}>
          {row.activo ? 'Activo' : 'Cerrado'}
        </Badge>
      )
    },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.cicloId)}>
            <Trash2 size={16} color="var(--color-danger-600)" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Button onClick={handleOpenNew} leftIcon={<Plus size={18} />}>
          Nuevo Ciclo
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<CicloRow>
            columns={columns}
            data={(ciclos as unknown as CicloRow[]) || []}
            keyExtractor={(row) => row.cicloId}
          />
        )}
      </div>

      <CicloFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cicloId={editingCiclo?.cicloId}
        initialData={editingCiclo ? {
          nombre: editingCiclo.nombre,
          // Ajustar para input type="date" que espera YYYY-MM-DD
          fechaInicio: new Date(editingCiclo.fechaInicio).toISOString().split('T')[0],
          fechaFin: new Date(editingCiclo.fechaFin).toISOString().split('T')[0]
        } : undefined}
      />
    </div>
  );
}
