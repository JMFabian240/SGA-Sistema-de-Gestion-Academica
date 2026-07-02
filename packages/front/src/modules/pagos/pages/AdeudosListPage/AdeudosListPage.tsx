import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { AdeudoFormModal } from '../../components/AdeudoFormModal/AdeudoFormModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type AdeudoRow = {
  calendarioPagoId: number;
  alumnoId: number;
  cicloId: number;
  concepto: string;
  mes: string | null;
  fechaVencimiento: string;
  montoOriginal: number;
  montoPagado: number;
  montoRecargo: number;
  saldoPendiente: number;
  estadoCobro: string;
  alumno?: { nombres: string; apellidos: string };
  ciclo?: { nombre: string };
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export function AdeudosListPage() {
  // Nota: La interfaz real podría requerir forzar un alumnoId en el query, pero 
  // para propósitos de listado global simularemos buscar los adeudos de un alumno en concreto o todos (requiere backend support).
  // Pasaremos un "alumno falso" o usaremos el query solo si se selecciona uno.
  // Por ahora asumiremos que la vista muestra un buscador de alumnos que alimenta el trpc.
  
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | null>(null);
  
  const { data: alumnos } = trpc.alumnos.getAll.useQuery();
  
  const { data: adeudos, isLoading, isFetching } = trpc.pagos.getAdeudos.useQuery(
    { alumnoId: selectedAlumnoId! },
    { enabled: !!selectedAlumnoId }
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdeudo, setEditingAdeudo] = useState<AdeudoRow | null>(null);

  const handleOpenEdit = (row: AdeudoRow) => {
    setEditingAdeudo(row);
    setIsModalOpen(true);
  };

  const columns: Column<AdeudoRow>[] = [
    { header: 'ID', accessor: 'calendarioPagoId' },
    { header: 'Concepto', accessor: (row) => `${row.concepto} ${row.mes ? `(${row.mes})` : ''}` },
    { header: 'Vencimiento', accessor: (row) => new Date(row.fechaVencimiento).toLocaleDateString() },
    { header: 'Original', accessor: (row) => formatCurrency(row.montoOriginal) },
    { header: 'Pagado', accessor: (row) => formatCurrency(row.montoPagado) },
    { header: 'Saldo (con recargo)', accessor: (row) => formatCurrency(row.saldoPendiente) },
    {
      header: 'Estado',
      accessor: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'default' = 'default';
        if (row.estadoCobro === 'PAGADO') variant = 'success';
        if (row.estadoCobro === 'PENDIENTE') variant = 'warning';
        if (row.estadoCobro === 'VENCIDO') variant = 'danger';

        return <Badge variant={variant}>{row.estadoCobro}</Badge>;
      }
    },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={16} /> Modificar
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      
      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Consultar Estado de Cuenta por Alumno</label>
        <select 
          value={selectedAlumnoId || ''} 
          onChange={(e) => setSelectedAlumnoId(parseInt(e.target.value, 10))}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%', maxWidth: '400px' }}
        >
          <option value="">Selecciona un Alumno para ver sus adeudos...</option>
          {alumnos?.map((a: any) => <option key={a.alumnoId} value={a.alumnoId}>{a.nombres} {a.apellidos}</option>)}
        </select>
      </div>

      {!selectedAlumnoId ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
          Selecciona un alumno para mostrar su historial de adeudos.
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          {isLoading || isFetching ? (
            <Spinner centered size={32} />
          ) : (
            <Table<AdeudoRow>
              columns={columns}
              data={(adeudos as unknown as AdeudoRow[]) || []}
              keyExtractor={(row) => row.calendarioPagoId}
            />
          )}
        </div>
      )}

      <AdeudoFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        adeudoId={editingAdeudo?.calendarioPagoId}
        initialData={editingAdeudo}
      />
    </div>
  );
}
