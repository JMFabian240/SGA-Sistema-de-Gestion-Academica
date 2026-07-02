import { useState } from 'react';
import { Search, Printer } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

export function AsistenciaReportePage() {
  const { data: grupos } = trpc.grupos.getGrupos.useQuery();
  
  const [filtros, setFiltros] = useState({
    grupoId: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  });

  const [queryParams, setQueryParams] = useState<{grupoId: number, mes?: number, anio?: number} | null>(null);

  const { data: reporte, isLoading, isFetching } = trpc.reportes.listaAsistencia.useQuery(
    queryParams!, 
    { enabled: !!queryParams }
  );

  const handleSearch = () => {
    if (!filtros.grupoId) return;
    setQueryParams({
      grupoId: parseInt(filtros.grupoId, 10),
      mes: filtros.mes || undefined,
      anio: filtros.anio || undefined,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Grupo</label>
          <select 
            value={filtros.grupoId} 
            onChange={(e) => setFiltros(prev => ({ ...prev, grupoId: e.target.value }))}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="">Selecciona un Grupo...</option>
            {grupos?.map((g: any) => (
              <option key={g.grupoId} value={g.grupoId}>{g.nombre} ({g.nivel?.nombre})</option>
            ))}
          </select>
        </div>
        <div style={{ width: '120px' }}>
          <Input 
            label="Mes (Opcional)" 
            type="number" 
            min="1" max="12"
            value={filtros.mes} 
            onChange={(e) => setFiltros(prev => ({ ...prev, mes: parseInt(e.target.value, 10) }))}
          />
        </div>
        <div style={{ width: '120px' }}>
          <Input 
            label="Año (Opcional)" 
            type="number" 
            value={filtros.anio} 
            onChange={(e) => setFiltros(prev => ({ ...prev, anio: parseInt(e.target.value, 10) }))}
          />
        </div>
        <Button onClick={handleSearch} leftIcon={<Search size={18} />} disabled={!filtros.grupoId || isFetching}>
          Ver Lista
        </Button>
        <Button variant="secondary" leftIcon={<Printer size={18} />} disabled={!reporte}>
          Imprimir / PDF
        </Button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', minHeight: '400px', padding: '24px' }}>
        {(!queryParams) ? (
          <div style={{ textAlign: 'center', color: '#6b7280', paddingTop: '64px' }}>
            Selecciona un grupo y presiona "Ver Lista" para cargar el reporte de asistencia.
          </div>
        ) : isLoading || isFetching ? (
          <Spinner centered size={48} />
        ) : reporte ? (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Reporte de Asistencias (Total Inscritos: {reporte.totalAlumnos})</h3>
            
            {/* 
              Nota: El backend actual `reportes.router.ts` envía `alumnos` como un array de strings, 
              y `registroDetallado` como un array plano de `asistencia` (crudo de la DB).
              En un entorno real, cruzaríamos esto para pintar un grid (Alumno x Día).
              Por ahora, mapeamos la data provista para demostrar conectividad.
            */}
            
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Alumnos en Lista</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {reporte.alumnos.map((a: string, idx: number) => (
                    <li key={idx} style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{idx + 1}. {a}</li>
                  ))}
                  {reporte.alumnos.length === 0 && <span style={{ color: '#9ca3af' }}>No hay alumnos inscritos.</span>}
                </ul>
              </div>

              <div style={{ flex: 2 }}>
                <h4 style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Registro Bruto de Faltas</h4>
                {reporte.registroDetallado.length === 0 ? (
                  <p style={{ color: '#9ca3af' }}>No hay inasistencias o registros en este rango de fechas.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>Fecha</th>
                        <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>Alumno ID</th>
                        <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.registroDetallado.map((r: any) => (
                        <tr key={r.asistenciaId}>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{new Date(r.fecha).toLocaleDateString()}</td>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{r.alumnoId}</td>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb', color: r.estado === 'FALTA' ? 'red' : 'inherit' }}>
                            {r.estado}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
