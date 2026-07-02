import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type IngresoRow = {
  pagoId: number;
  fecha: string;
  alumno: string;
  tutor: string;
  metodo: string;
  montoTotal: number;
  cajero: string;
};

export function IngresosReportePage() {
  const [fechas, setFechas] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
  });

  const [queryDates, setQueryDates] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    fechaFin: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
  });

  const { data: ingresos, isLoading, isFetching } = trpc.reportes.reporteIngresos.useQuery(queryDates);

  const handleSearch = () => {
    setQueryDates({
      fechaInicio: new Date(`${fechas.fechaInicio}T00:00:00.000Z`).toISOString(),
      fechaFin: new Date(`${fechas.fechaFin}T23:59:59.999Z`).toISOString(),
    });
  };

  const columns: Column<IngresoRow>[] = [
    { header: 'Folio Pago', accessor: 'pagoId' },
    { header: 'Fecha y Hora', accessor: (row) => new Date(row.fecha).toLocaleString() },
    { header: 'Alumno', accessor: 'alumno' },
    { header: 'Tutor que Pagó', accessor: 'tutor' },
    { header: 'Cajero', accessor: 'cajero' },
    { header: 'Método', accessor: 'metodo' },
    { 
      header: 'Monto Cobrado', 
      accessor: (row) => `$${row.montoTotal.toFixed(2)}` 
    },
  ];

  const totalIngresos = ingresos?.reduce((acc, curr) => acc + curr.montoTotal, 0) || 0;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Input 
            label="Fecha Inicio" 
            type="date" 
            value={fechas.fechaInicio} 
            onChange={(e) => setFechas(prev => ({ ...prev, fechaInicio: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Input 
            label="Fecha Fin" 
            type="date" 
            value={fechas.fechaFin} 
            onChange={(e) => setFechas(prev => ({ ...prev, fechaFin: e.target.value }))}
          />
        </div>
        <Button onClick={handleSearch} leftIcon={<Search size={18} />} disabled={isFetching}>
          Generar Reporte
        </Button>
        <Button variant="secondary" leftIcon={<Download size={18} />}>
          Exportar a Excel
        </Button>
      </div>

      <div style={{ padding: '16px', background: '#e0f2fe', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#0369a1' }}>Total Ingresado en el Periodo:</span>
        <span style={{ fontSize: '24px', fontWeight: 700, color: '#0284c7' }}>${totalIngresos.toFixed(2)}</span>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading || isFetching ? (
          <Spinner centered size={32} />
        ) : (
          <Table<IngresoRow>
            columns={columns}
            data={(ingresos as unknown as IngresoRow[]) || []}
            keyExtractor={(row) => row.pagoId}
          />
        )}
      </div>
    </div>
  );
}
