import { useState, useMemo } from 'react';
import { trpc } from '../../../../lib/trpc';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import styles from './RegistroPagoPage.module.css';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export function RegistroPagoPage() {
  const utils = trpc.useUtils();
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | null>(null);
  
  // Catálogos
  const { data: alumnos } = trpc.alumnos.getAll.useQuery();
  
  // Adeudos del alumno seleccionado
  const { data: adeudos, isLoading: isLoadingAdeudos } = trpc.pagos.getAdeudos.useQuery(
    { alumnoId: selectedAlumnoId!, estadoCobro: 'PENDIENTE' },
    { enabled: !!selectedAlumnoId }
  );

  // Formulario de Pago
  const [selectedAdeudoIds, setSelectedAdeudoIds] = useState<Set<number>>(new Set());
  const [metodoPago, setMetodoPago] = useState<'DEPOSITO'|'TRANSFERENCIA'|'TARJETA_DEBITO'|'TARJETA_CREDITO'>('EFECTIVO' as any); // Usaremos transferencia por default
  const [tutorId, setTutorId] = useState<string>('1'); // Simplificación: Asumimos que el id del tutor pagador es el 1
  const [observaciones, setObservaciones] = useState<string>('');

  const handleToggleAdeudo = (id: number) => {
    const newSet = new Set(selectedAdeudoIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAdeudoIds(newSet);
  };

  const adeudosToPay = useMemo(() => {
    if (!adeudos) return [];
    return (adeudos as any[]).filter(a => selectedAdeudoIds.has(a.calendarioPagoId));
  }, [adeudos, selectedAdeudoIds]);

  const montoTotal = useMemo(() => {
    return adeudosToPay.reduce((acc, curr) => acc + curr.saldoPendiente, 0);
  }, [adeudosToPay]);

  const registrarPagoMutation = trpc.pagos.registrarPago.useMutation({
    onSuccess: () => {
      alert('Pago registrado con éxito.');
      utils.pagos.getAdeudos.invalidate();
      setSelectedAdeudoIds(newSet => { newSet.clear(); return newSet; });
      setObservaciones('');
    },
    onError: (err) => {
      alert(`Error al registrar pago: ${err.message}`);
    }
  });

  const handleCobrar = () => {
    if (adeudosToPay.length === 0) {
      alert('Debes seleccionar al menos un adeudo.');
      return;
    }

    // Armar payload
    const aplicaciones = adeudosToPay.map(a => ({
      calendarioPagoId: a.calendarioPagoId,
      montoAplicado: a.saldoPendiente,
      aplicadoA: 'CAPITAL' as const // Para simplificar, asumimos todo a capital por ahora
    }));

    registrarPagoMutation.mutate({
      alumnoId: selectedAlumnoId!,
      tutorId: parseInt(tutorId, 10),
      fechaPago: new Date().toISOString(),
      montoTotal,
      metodoPago: metodoPago || 'TRANSFERENCIA',
      observaciones: observaciones || undefined,
      aplicaciones
    });
  };

  const columns: Column<any>[] = [
    {
      header: 'Cobrar',
      accessor: (row) => (
        <input 
          type="checkbox" 
          checked={selectedAdeudoIds.has(row.calendarioPagoId)}
          onChange={() => handleToggleAdeudo(row.calendarioPagoId)}
          style={{ width: '18px', height: '18px' }}
        />
      )
    },
    { header: 'Concepto', accessor: (row) => `${row.concepto} ${row.mes ? `(${row.mes})` : ''}` },
    { header: 'Vence', accessor: (row) => new Date(row.fechaVencimiento).toLocaleDateString() },
    { header: 'Saldo Pendiente', accessor: (row) => formatCurrency(row.saldoPendiente) },
    {
      header: 'Estatus',
      accessor: (row) => (
        <Badge variant={new Date(row.fechaVencimiento) < new Date() ? 'danger' : 'warning'}>
          {new Date(row.fechaVencimiento) < new Date() ? 'Vencido' : 'Pendiente'}
        </Badge>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <h2 className={styles.sectionTitle}>1. Búsqueda de Alumno</h2>
        <select 
          value={selectedAlumnoId || ''} 
          onChange={(e) => {
            setSelectedAlumnoId(parseInt(e.target.value, 10));
            setSelectedAdeudoIds(new Set());
          }}
          className={styles.select}
        >
          <option value="">Selecciona al Alumno que va a pagar...</option>
          {alumnos?.map((a: any) => <option key={a.alumnoId} value={a.alumnoId}>{a.nombres} {a.apellidos}</option>)}
        </select>

        {selectedAlumnoId && (
          <div className={styles.adeudosList}>
            <h2 className={styles.sectionTitle} style={{ marginTop: '24px' }}>2. Seleccionar Adeudos Pendientes</h2>
            {isLoadingAdeudos ? (
              <Spinner />
            ) : adeudos?.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Este alumno no tiene adeudos pendientes.</p>
            ) : (
              <Table 
                columns={columns}
                data={adeudos as any[]}
                keyExtractor={(row) => row.calendarioPagoId}
              />
            )}
          </div>
        )}
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.summaryCard}>
          <h2 className={styles.sectionTitle}>Resumen de Cobro</h2>
          
          <div className={styles.summaryLine}>
            <span>Adeudos seleccionados:</span>
            <span>{adeudosToPay.length}</span>
          </div>

          <div className={styles.summaryTotal}>
            <span>Total a Pagar:</span>
            <span>{formatCurrency(montoTotal)}</span>
          </div>

          <div className={styles.formGroup} style={{ marginTop: '24px' }}>
            <label>Método de Pago</label>
            <select 
              value={metodoPago} 
              onChange={(e) => setMetodoPago(e.target.value as any)}
              className={styles.select}
            >
              <option value="TRANSFERENCIA">Transferencia SPEI</option>
              <option value="DEPOSITO">Depósito Bancario</option>
              <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
              <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>ID del Tutor (Referencia)</label>
            <Input 
              value={tutorId}
              onChange={(e) => setTutorId(e.target.value)}
              placeholder="Ej. 1"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Observaciones Adicionales</label>
            <Input 
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Pago realizado en ventanilla..."
            />
          </div>

          <Button 
            className={styles.payButton} 
            size="lg" 
            onClick={handleCobrar}
            disabled={montoTotal === 0 || registrarPagoMutation.isPending}
            isLoading={registrarPagoMutation.isPending}
          >
            {registrarPagoMutation.isPending ? 'Procesando...' : `Registrar Pago por ${formatCurrency(montoTotal)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
