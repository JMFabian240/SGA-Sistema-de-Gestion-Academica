import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { TarifaFormModal } from '../../components/TarifaFormModal/TarifaFormModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type TarifaRow = {
  tarifaId: number;
  cicloId: number;
  nivelId: number;
  concepto: string;
  monto: number;
  descripcion: string | null;
  activa: boolean;
  ciclo: { nombre: string };
  nivel: { nombre: string };
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export function TarifasListPage() {
  const { data: tarifas, isLoading } = trpc.pagos.getTarifas.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.pagos.deleteTarifa.useMutation({
    onSuccess: () => utils.pagos.getTarifas.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState<TarifaRow | null>(null);

  const handleOpenNew = () => {
    setEditingTarifa(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: TarifaRow) => {
    setEditingTarifa(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar esta tarifa?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<TarifaRow>[] = [
    { header: 'ID', accessor: 'tarifaId' },
    { header: 'Ciclo', accessor: (row) => row.ciclo?.nombre },
    { header: 'Nivel', accessor: (row) => row.nivel?.nombre },
    { header: 'Concepto', accessor: 'concepto' },
    { header: 'Monto Base', accessor: (row) => formatCurrency(row.monto) },
    {
      header: 'Estado',
      accessor: (row) => (
        <Badge variant={row.activa ? 'success' : 'default'}>
          {row.activa ? 'Activa' : 'Inactiva'}
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
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.tarifaId)}>
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
          Nueva Tarifa
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<TarifaRow>
            columns={columns}
            data={(tarifas as unknown as TarifaRow[]) || []}
            keyExtractor={(row) => row.tarifaId}
          />
        )}
      </div>

      <TarifaFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tarifaId={editingTarifa?.tarifaId}
        initialData={editingTarifa}
      />
    </div>
  );
}
