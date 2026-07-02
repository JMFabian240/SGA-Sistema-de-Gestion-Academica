import { AlertTriangle, Download } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type DeudorRow = {
  alumno: string;
  matricula: string | null;
  tutorPrincipal: string;
  telefonoTutor: string;
  concepto: string;
  mes: number;
  montoAdeudo: number;
  diasAtraso: number;
};

export function DeudoresReportePage() {
  const { data: deudores, isLoading } = trpc.reportes.reporteDeudores.useQuery();

  const columns: Column<DeudorRow>[] = [
    { header: 'Alumno', accessor: (row) => `${row.matricula ? `[${row.matricula}] ` : ''}${row.alumno}` },
    { header: 'Tutor Responsable', accessor: 'tutorPrincipal' },
    { header: 'Tel. Contacto', accessor: 'telefonoTutor' },
    { header: 'Adeudo Vencido', accessor: (row) => `${row.concepto} (Mes ${row.mes})` },
    { 
      header: 'Monto Vencido', 
      accessor: (row) => <strong style={{ color: 'var(--color-danger-600)' }}>${row.montoAdeudo.toFixed(2)}</strong> 
    },
    { 
      header: 'Días de Atraso', 
      accessor: (row) => (
        <Badge variant={row.diasAtraso > 30 ? 'danger' : 'warning'}>
          {row.diasAtraso} días
        </Badge>
      ) 
    },
  ];

  const totalVencido = deudores?.reduce((acc, curr) => acc + curr.montoAdeudo, 0) || 0;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={24} color="var(--color-danger-600)" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-danger-700)' }}>Atención: Cuentas por Cobrar</h2>
        </div>
        <Button variant="secondary" leftIcon={<Download size={18} />}>
          Exportar Lista a Excel
        </Button>
      </div>

      <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fecaca' }}>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#b91c1c' }}>Monto Total en Cartera Vencida:</span>
        <span style={{ fontSize: '24px', fontWeight: 700, color: '#991b1b' }}>${totalVencido.toFixed(2)}</span>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<DeudorRow>
            columns={columns}
            data={(deudores as unknown as DeudorRow[]) || []}
            keyExtractor={(row) => `${row.alumno}-${row.concepto}`}
          />
        )}
      </div>
    </div>
  );
}
