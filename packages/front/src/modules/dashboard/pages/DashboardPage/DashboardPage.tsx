import React from 'react';
import { trpc } from '../../../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card/Card';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { Users, AlertCircle, WalletCards, GraduationCap } from 'lucide-react';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const inscripcionesQuery = trpc.dashboard.obtenerMetricasInscripcion.useQuery();
  const finanzasQuery = trpc.dashboard.obtenerKpisFinancieros.useQuery();

  const isLoading = inscripcionesQuery.isLoading || finanzasQuery.isLoading;

  if (isLoading) {
    return <Spinner centered size={40} />;
  }

  const metricasInscripcion = inscripcionesQuery.data;
  const kpisFinanzas = finanzasQuery.data;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Resumen General</h1>
        <p className={styles.subtitle}>Métricas principales del colegio en tiempo real.</p>
      </div>

      <div className={styles.grid}>
        <Card>
          <CardContent className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)' }}>
              <Users size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Alumnos Activos</span>
              <span className={styles.kpiValue}>{metricasInscripcion?.alumnosActivos || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
              <WalletCards size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Ingresos del Mes</span>
              <span className={styles.kpiValue}>
                ${kpisFinanzas?.ingresosMesActual?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}>
              <AlertCircle size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Adeudos Vencidos</span>
              <span className={styles.kpiValue}>
                ${kpisFinanzas?.deudaPendienteTotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>
              <GraduationCap size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Capacidad Total</span>
              <span className={styles.kpiValue}>{metricasInscripcion?.cuposTotales || 0} lugares</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Opcional: Gráficos o detalles por nivel en el futuro */}
      <div className={styles.detailsGrid}>
        <Card>
          <CardHeader>
            <CardTitle>Ocupación por Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            {metricasInscripcion?.detallesNivel?.map(nivel => (
              <div key={nivel.nivelId} className={styles.levelRow}>
                <span className={styles.levelName}>Nivel ID: {nivel.nivelId}</span>
                <span className={styles.levelCupo}>{nivel._sum.cupoMaximo || 0} lugares disponibles</span>
              </div>
            ))}
            {!metricasInscripcion?.detallesNivel?.length && (
              <p className={styles.emptyText}>No hay datos de niveles configurados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
