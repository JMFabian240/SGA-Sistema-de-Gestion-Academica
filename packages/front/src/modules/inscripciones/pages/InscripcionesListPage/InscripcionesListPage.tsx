import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { InscripcionFormModal } from '../../components/InscripcionFormModal/InscripcionFormModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css'; // Reutilizamos estilos genéricos de tabla

type InscripcionRow = {
  inscripcionId: number;
  alumnoId: number;
  cicloId: number;
  grupoId: number | null;
  planPagoId: number;
  fechaIngreso: string;
  estadoEnCiclo: string;
  estadoFinanciero: string;
  alumno: { nombres: string; apellidos: string; matricula: string | null };
  ciclo: { nombre: string };
  grupo: { nombre: string } | null;
  planPago: { nombre: string };
};

export function InscripcionesListPage() {
  const { data: inscripciones, isLoading } = trpc.inscripciones.getInscripciones.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.inscripciones.deleteInscripcion.useMutation({
    onSuccess: () => utils.inscripciones.getInscripciones.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInscripcion, setEditingInscripcion] = useState<InscripcionRow | null>(null);

  const handleOpenNew = () => {
    setEditingInscripcion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: InscripcionRow) => {
    setEditingInscripcion(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar esta inscripción? Si existen pagos vinculados a ella, esto fallará por llaves foráneas.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<InscripcionRow>[] = [
    { header: 'ID', accessor: 'inscripcionId' },
    { 
      header: 'Alumno', 
      accessor: (row) => `${row.alumno?.nombres} ${row.alumno?.apellidos} ${row.alumno?.matricula ? `(${row.alumno.matricula})` : ''}` 
    },
    { header: 'Ciclo', accessor: (row) => row.ciclo?.nombre },
    { header: 'Grupo', accessor: (row) => row.grupo?.nombre || 'Sin Grupo' },
    { header: 'Plan Pago', accessor: (row) => row.planPago?.nombre },
    {
      header: 'Académico',
      accessor: (row) => (
        <Badge variant={row.estadoEnCiclo === 'INSCRITO' ? 'success' : row.estadoEnCiclo === 'BAJA' ? 'danger' : 'default'}>
          {row.estadoEnCiclo}
        </Badge>
      )
    },
    {
      header: 'Finanzas',
      accessor: (row) => (
        <Badge variant={row.estadoFinanciero === 'AL_CORRIENTE' ? 'success' : 'warning'}>
          {row.estadoFinanciero.replace('_', ' ')}
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
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.inscripcionId)}>
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
          Nueva Inscripción
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<InscripcionRow>
            columns={columns}
            data={(inscripciones as unknown as InscripcionRow[]) || []}
            keyExtractor={(row) => row.inscripcionId}
          />
        )}
      </div>

      <InscripcionFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inscripcionId={editingInscripcion?.inscripcionId}
        initialData={editingInscripcion}
      />
    </div>
  );
}
