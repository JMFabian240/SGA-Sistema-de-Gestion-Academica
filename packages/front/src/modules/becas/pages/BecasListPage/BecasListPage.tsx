import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { BecaFormModal } from '../../components/BecaFormModal/BecaFormModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type BecaRow = {
  becaId: number;
  nombreBeca: string;
  criterio: string;
  porcentaje: number;
  descripcion: string | null;
};

export function BecasListPage() {
  const { data: becas, isLoading } = trpc.becas.getBecas.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.becas.deleteBeca.useMutation({
    onSuccess: () => utils.becas.getBecas.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeca, setEditingBeca] = useState<BecaRow | null>(null);

  const handleOpenNew = () => {
    setEditingBeca(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: BecaRow) => {
    setEditingBeca(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar esta Beca del catálogo? (No afectará becas ya otorgadas si la lógica de DB lo permite)')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<BecaRow>[] = [
    { header: 'ID', accessor: 'becaId' },
    { header: 'Nombre', accessor: 'nombreBeca' },
    {
      header: 'Criterio',
      accessor: (row) => (
        <Badge variant="default">
          {row.criterio.replace('_', ' ')}
        </Badge>
      )
    },
    { header: 'Descuento (%)', accessor: (row) => `${row.porcentaje}%` },
    { header: 'Descripción', accessor: (row) => row.descripcion || '-' },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.becaId)}>
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
          Nueva Beca
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<BecaRow>
            columns={columns}
            data={(becas as unknown as BecaRow[]) || []}
            keyExtractor={(row) => row.becaId}
          />
        )}
      </div>

      <BecaFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        becaId={editingBeca?.becaId}
        initialData={editingBeca}
      />
    </div>
  );
}
