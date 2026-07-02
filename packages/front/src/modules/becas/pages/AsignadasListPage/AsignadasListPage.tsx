import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button';
import { AsignarBecaModal } from '../../components/AsignarBecaModal/AsignarBecaModal';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

export function AsignadasListPage() {
  // Nota: El backend `becas.router.ts` no parece tener un endpoint explícito `getBecasAsignadas`
  // Para propósitos de este layout y demostración, habilitaremos el modal para asignar becas 
  // (flujo paralelo a la autorización manual) y mostraremos un mensaje en caso de no tener el endpoint.
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Zap size={18} />} style={{ backgroundColor: 'var(--color-primary-600)' }}>
          Otorgar Beca Directa (Automática)
        </Button>
      </div>

      <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <h3 style={{ color: '#374151', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Becas Vigentes</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
          Aquí se mostrarán todos los alumnos que actualmente cuentan con una beca activa, suspendida o vencida.
          (El endpoint de listado de asignaciones debe integrarse en la API del backend).
        </p>
      </div>

      <AsignarBecaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
