import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { PlanPagoFormModal } from '../../components/PlanPagoFormModal/PlanPagoFormModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css'; // Reutilizamos estilos

type PlanPagoRow = {
  planPagoId: number;
  nombre: string;
  meses: number;
  montoMensual: number;
  montoDiciembre: number | null;
  descripcion: string | null;
  activo: boolean;
};

const formatCurrency = (val: number | null) => {
  if (val === null || val === undefined) return '-';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export function PlanesPagoListPage() {
  const { data: planes, isLoading } = trpc.inscripciones.getPlanesPago.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.inscripciones.deletePlanPago.useMutation({
    onSuccess: () => utils.inscripciones.getPlanesPago.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanPagoRow | null>(null);

  const handleOpenNew = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: PlanPagoRow) => {
    setEditingPlan(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar este plan? Afectará a inscripciones futuras o pasadas si no tienes soft delete.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<PlanPagoRow>[] = [
    { header: 'ID', accessor: 'planPagoId' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Meses', accessor: 'meses' },
    { header: 'Monto Mensual', accessor: (row) => formatCurrency(row.montoMensual) },
    { header: 'Diciembre', accessor: (row) => formatCurrency(row.montoDiciembre) },
    {
      header: 'Estado',
      accessor: (row) => (
        <Badge variant={row.activo ? 'success' : 'default'}>
          {row.activo ? 'Activo' : 'Inactivo'}
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
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.planPagoId)}>
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
          Nuevo Plan
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<PlanPagoRow>
            columns={columns}
            data={(planes as unknown as PlanPagoRow[]) || []}
            keyExtractor={(row) => row.planPagoId}
          />
        )}
      </div>

      <PlanPagoFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planPagoId={editingPlan?.planPagoId}
        initialData={editingPlan}
      />
    </div>
  );
}
