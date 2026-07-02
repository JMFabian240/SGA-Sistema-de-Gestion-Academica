import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { NivelFormModal } from '../../components/NivelFormModal/NivelFormModal';
import styles from './NivelesListPage.module.css';

type NivelRow = {
  nivelId: number;
  codigo: string;
  nombre: string;
  rvoe: string | null;
  orden: number;
};

export function NivelesListPage() {
  const { data: niveles, isLoading } = trpc.grupos.getNiveles.useQuery();
  const deleteMutation = trpc.grupos.deleteNivel.useMutation({
    onSuccess: () => utils.grupos.getNiveles.invalidate()
  });
  const utils = trpc.useUtils();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNivel, setEditingNivel] = useState<NivelRow | null>(null);

  const handleOpenNew = () => {
    setEditingNivel(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: NivelRow) => {
    setEditingNivel(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar este nivel? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<NivelRow>[] = [
    { header: 'Orden', accessor: 'orden' },
    { header: 'Código', accessor: 'codigo' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'RVOE', accessor: (row) => row.rvoe || '-' },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.nivelId)}>
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
          Nuevo Nivel
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<NivelRow>
            columns={columns}
            data={niveles || []}
            keyExtractor={(row) => row.nivelId}
          />
        )}
      </div>

      <NivelFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nivelId={editingNivel?.nivelId}
        initialData={editingNivel ? {
          codigo: editingNivel.codigo,
          nombre: editingNivel.nombre,
          rvoe: editingNivel.rvoe || '',
          orden: editingNivel.orden
        } : undefined}
      />
    </div>
  );
}
