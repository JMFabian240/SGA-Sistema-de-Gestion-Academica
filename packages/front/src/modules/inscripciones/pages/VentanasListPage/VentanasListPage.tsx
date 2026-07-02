import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { VentanaFormModal } from '../../components/VentanaFormModal/VentanaFormModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css'; // Reutilizamos estilos

type VentanaRow = {
  ventanaId: number;
  cicloId: number;
  becaId: number;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  ciclo: { nombre: string };
  beca: { nombre: string; porcentaje: number };
};

export function VentanasListPage() {
  const { data: ventanas, isLoading } = trpc.inscripciones.getVentanas.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.inscripciones.deleteVentana.useMutation({
    onSuccess: () => utils.inscripciones.getVentanas.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVentana, setEditingVentana] = useState<VentanaRow | null>(null);

  const handleOpenNew = () => {
    setEditingVentana(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: VentanaRow) => {
    setEditingVentana(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar esta ventana temprana?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<VentanaRow>[] = [
    { header: 'ID', accessor: 'ventanaId' },
    { header: 'Ciclo Escolar', accessor: (row) => row.ciclo?.nombre },
    { header: 'Beca Asociada', accessor: (row) => `${row.beca?.nombre} (${row.beca?.porcentaje}%)` },
    { header: 'Abre', accessor: (row) => new Date(row.fechaInicio).toLocaleDateString() },
    { header: 'Cierra', accessor: (row) => new Date(row.fechaFin).toLocaleDateString() },
    {
      header: 'Estado',
      accessor: (row) => {
        // Lógica visual básica
        const now = new Date();
        const end = new Date(row.fechaFin);
        const isOpen = row.activa && now <= end;
        
        return (
          <Badge variant={isOpen ? 'success' : 'default'}>
            {isOpen ? 'Vigente' : 'Expirada/Inactiva'}
          </Badge>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.ventanaId)}>
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
          Nueva Ventana
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<VentanaRow>
            columns={columns}
            data={(ventanas as unknown as VentanaRow[]) || []}
            keyExtractor={(row) => row.ventanaId}
          />
        )}
      </div>

      <VentanaFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ventanaId={editingVentana?.ventanaId}
        initialData={editingVentana}
      />
    </div>
  );
}
