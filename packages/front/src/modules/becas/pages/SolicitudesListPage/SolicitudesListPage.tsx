import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Badge } from '../../../../components/ui/Badge/Badge';
import { SolicitudFormModal } from '../../components/SolicitudFormModal/SolicitudFormModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type SolicitudRow = {
  solicitudId: number;
  alumnoId: number;
  becaId: number;
  cicloId: number;
  motivo: string | null;
  estado: string; // ACTIVA, SUSPENDIDA, CANCELADA, VENCIDA (usualmente para backend, en solicitud puede ser distinto o usar este)
  // Nota: Idealmente el backend tendría PENDIENTE, APROBADA, RECHAZADA para solicitudes. 
  // Por el esquema, asumo que manejan ACTIVA como pendiente o directamente usan otra bandera. 
  // Trataremos ACTIVA como "Pendiente" y CANCELADA como rechazada para simplificar.
  alumno?: { nombres: string; apellidos: string };
  beca?: { nombreBeca: string; porcentaje: number };
  ciclo?: { nombre: string };
};

export function SolicitudesListPage() {
  // Opcional: Filtros para listado
  const { data: solicitudes, isLoading } = trpc.becas.getSolicitudes.useQuery({});
  const utils = trpc.useUtils();
  
  const resolverMutation = trpc.becas.resolverSolicitud.useMutation({
    onSuccess: () => utils.becas.getSolicitudes.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleResolver = (id: number, aprobar: boolean) => {
    const accion = aprobar ? 'aprobar' : 'rechazar';
    const notas = prompt(`Ingresa observaciones para ${accion} la solicitud (Opcional):`, '');
    if (notas !== null) {
      resolverMutation.mutate({
        solicitudId: id,
        aprobar,
        observacionesResolucion: notas || undefined
      });
    }
  };

  const columns: Column<SolicitudRow>[] = [
    { header: 'Folio', accessor: 'solicitudId' },
    { header: 'Alumno', accessor: (row) => `${row.alumno?.nombres} ${row.alumno?.apellidos}` },
    { header: 'Beca Solicitada', accessor: (row) => `${row.beca?.nombreBeca} (${row.beca?.porcentaje}%)` },
    { header: 'Ciclo', accessor: (row) => row.ciclo?.nombre },
    { header: 'Motivo', accessor: (row) => row.motivo || '-' },
    {
      header: 'Estado de Solicitud',
      accessor: (row) => {
        // En nuestro dominio ACTIVA = Aprobada o En Revisión según el prisma schema original, 
        // pero usaremos colores descriptivos.
        let variant: 'success' | 'warning' | 'danger' | 'default' = 'default';
        if (row.estado === 'ACTIVA') variant = 'success';
        if (row.estado === 'PENDIENTE') variant = 'warning';
        if (row.estado === 'CANCELADA') variant = 'danger';
        
        return <Badge variant={variant}>{row.estado}</Badge>;
      }
    },
    {
      header: 'Resolución',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleResolver(row.solicitudId, true)}
            title="Aprobar"
            style={{ color: 'var(--color-success-600)' }}
          >
            <Check size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleResolver(row.solicitudId, false)}
            title="Rechazar"
            style={{ color: 'var(--color-danger-600)' }}
          >
            <X size={18} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} />}>
          Capturar Solicitud
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<SolicitudRow>
            columns={columns}
            data={(solicitudes as unknown as SolicitudRow[]) || []}
            keyExtractor={(row) => row.solicitudId}
          />
        )}
      </div>

      <SolicitudFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
