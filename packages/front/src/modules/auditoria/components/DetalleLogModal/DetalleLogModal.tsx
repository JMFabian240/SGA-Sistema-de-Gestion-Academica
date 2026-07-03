import { Modal } from '../../../../components/ui/Modal/Modal';
import { Button } from '../../../../components/ui/Button/Button';
import styles from '../../../grupos/components/NivelFormModal/FormModal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  log: any; // Se pasa el registro de auditoría completo
};

export function DetalleLogModal({ isOpen, onClose, log }: Props) {
  if (!log) return null;

  const renderJson = (data: any) => {
    if (!data) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin datos / Nulo</span>;
    let parsed = data;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        return <span>{data}</span>;
      }
    }
    return (
      <pre style={{ 
        background: '#1f2937', 
        color: '#f3f4f6', 
        padding: '12px', 
        borderRadius: '6px', 
        fontSize: '12px',
        overflowX: 'auto',
        maxHeight: '300px'
      }}>
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Auditoría - Log #${log.logId}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '600px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f3f4f6', padding: '12px', borderRadius: '8px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Acción</span>
            <strong style={{ fontSize: '14px', color: '#374151' }}>{log.accion} en {log.tablaAfectada}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Usuario Responsable</span>
            <strong style={{ fontSize: '14px', color: '#374151' }}>{log.usuario?.nombreCompleto || `ID: ${log.usuarioId}`}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Fecha y Hora</span>
            <strong style={{ fontSize: '14px', color: '#374151' }}>{new Date(log.fechaHora).toLocaleString()}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Registro ID (PK)</span>
            <strong style={{ fontSize: '14px', color: '#374151' }}>{log.registroId}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>Datos Anteriores</h4>
            {renderJson(log.datosAnteriores)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', marginBottom: '8px' }}>Datos Nuevos</h4>
            {renderJson(log.datosNuevos)}
          </div>
        </div>

        <div className={styles.actions} style={{ marginTop: '16px' }}>
          <Button type="button" onClick={onClose}>
            Cerrar Detalles
          </Button>
        </div>
      </div>
    </Modal>
  );
}
