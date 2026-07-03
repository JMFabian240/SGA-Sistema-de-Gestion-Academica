import { useState } from 'react';
import { Search, Eye, Filter } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { DetalleLogModal } from '../../components/DetalleLogModal/DetalleLogModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type LogRow = {
  logId: string;
  tablaAfectada: string;
  registroId: number;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  datosAnteriores: any;
  datosNuevos: any;
  fechaHora: string;
  usuarioId: number;
  usuario?: { nombreUsuario: string; nombreCompleto: string };
};

export function AuditoriaListPage() {
  const [pagina, setPagina] = useState(1);
  const limite = 50; // Constante para este visor

  const [filtrosVisibles, setFiltrosVisibles] = useState({
    accion: '' as '' | 'INSERT' | 'UPDATE' | 'DELETE',
    tablaAfectada: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const [queryParams, setQueryParams] = useState({
    pagina,
    limite,
    accion: undefined as undefined | 'INSERT' | 'UPDATE' | 'DELETE',
    tablaAfectada: undefined as string | undefined,
    fechaInicio: undefined as string | undefined,
    fechaFin: undefined as string | undefined,
  });

  const { data, isLoading, isFetching } = trpc.auditoria.obtenerLogs.useQuery(queryParams, {
    keepPreviousData: true, // Para que la tabla no parpadee al cambiar de página
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);

  const handleSearch = () => {
    setPagina(1);
    setQueryParams({
      pagina: 1,
      limite,
      accion: filtrosVisibles.accion || undefined,
      tablaAfectada: filtrosVisibles.tablaAfectada || undefined,
      fechaInicio: filtrosVisibles.fechaInicio ? new Date(`${filtrosVisibles.fechaInicio}T00:00:00.000Z`).toISOString() : undefined,
      fechaFin: filtrosVisibles.fechaFin ? new Date(`${filtrosVisibles.fechaFin}T23:59:59.999Z`).toISOString() : undefined,
    });
  };

  const handlePageChange = (nuevaPagina: number) => {
    setPagina(nuevaPagina);
    setQueryParams(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const handleOpenDetail = (log: LogRow) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const columns: Column<LogRow>[] = [
    { header: 'ID Log', accessor: 'logId' },
    { header: 'Fecha y Hora', accessor: (row) => new Date(row.fechaHora).toLocaleString() },
    { 
      header: 'Acción', 
      accessor: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'default' = 'default';
        if (row.accion === 'INSERT') variant = 'success';
        if (row.accion === 'UPDATE') variant = 'warning';
        if (row.accion === 'DELETE') variant = 'danger';
        return <Badge variant={variant}>{row.accion}</Badge>;
      } 
    },
    { header: 'Tabla Afectada', accessor: 'tablaAfectada' },
    { header: 'Registro PK', accessor: 'registroId' },
    { header: 'Usuario', accessor: (row) => row.usuario?.nombreCompleto || row.usuarioId },
    {
      header: 'Detalles',
      accessor: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(row)} title="Ver JSON">
          <Eye size={18} color="var(--color-primary-600)" />
        </Button>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Tipo de Acción</label>
          <select 
            value={filtrosVisibles.accion} 
            onChange={(e) => setFiltrosVisibles(prev => ({ ...prev, accion: e.target.value as any }))}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          >
            <option value="">Todas</option>
            <option value="INSERT">INSERT (Creación)</option>
            <option value="UPDATE">UPDATE (Modificación)</option>
            <option value="DELETE">DELETE (Eliminación)</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <Input 
            label="Tabla Exacta" 
            placeholder="Ej. Alumno"
            value={filtrosVisibles.tablaAfectada} 
            onChange={(e) => setFiltrosVisibles(prev => ({ ...prev, tablaAfectada: e.target.value }))}
          />
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <Input 
            label="Fecha Inicio" 
            type="date" 
            value={filtrosVisibles.fechaInicio} 
            onChange={(e) => setFiltrosVisibles(prev => ({ ...prev, fechaInicio: e.target.value }))}
          />
        </div>
        
        <div style={{ flex: 1, minWidth: '150px' }}>
          <Input 
            label="Fecha Fin" 
            type="date" 
            value={filtrosVisibles.fechaFin} 
            onChange={(e) => setFiltrosVisibles(prev => ({ ...prev, fechaFin: e.target.value }))}
          />
        </div>

        <Button onClick={handleSearch} leftIcon={<Filter size={18} />} disabled={isFetching}>
          Aplicar Filtros
        </Button>
      </div>

      <div className={styles.tableWrapper} style={{ position: 'relative' }}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <>
            {isFetching && !isLoading && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.5)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spinner size={32} />
              </div>
            )}
            <Table<LogRow>
              columns={columns}
              data={(data?.data as unknown as LogRow[]) || []}
              keyExtractor={(row) => row.logId}
            />
          </>
        )}
      </div>

      {data?.meta && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Mostrando página {data.meta.pagina} de {data.meta.totalPaginas} ({data.meta.total} registros en total)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={data.meta.pagina <= 1 || isFetching} 
              onClick={() => handlePageChange(data.meta.pagina - 1)}
            >
              Anterior
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={data.meta.pagina >= data.meta.totalPaginas || isFetching} 
              onClick={() => handlePageChange(data.meta.pagina + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <DetalleLogModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        log={selectedLog} 
      />
    </div>
  );
}
