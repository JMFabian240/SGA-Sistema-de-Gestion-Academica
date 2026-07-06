import { trpc } from '../../../../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card/Card';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Button } from '../../../../components/ui/Button/Button';
import { Users, TrendingUp, AlertTriangle, Medal, WalletCards, Clock, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const inscripcionesQuery = trpc.dashboard.obtenerMetricasInscripcion.useQuery();
  const finanzasQuery = trpc.dashboard.obtenerKpisFinancieros.useQuery();
  const ingresosChartQuery = trpc.dashboard.obtenerIngresosUltimos7Dias.useQuery();

  const isLoading = inscripcionesQuery.isLoading || finanzasQuery.isLoading || ingresosChartQuery.isLoading;

  if (isLoading) {
    return <Spinner centered size={40} />;
  }

  const metricasInscripcion = inscripcionesQuery.data;
  const kpisFinanzas = finanzasQuery.data;
  const chartData = ingresosChartQuery.data || [];

  // Formatting helper
  const formatCurrency = (value: number) => 
    `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Resumen operativo y financiero del día</p>
        </div>
        <Button className={styles.pagoRapidoBtn}>
          <WalletCards size={18} className={styles.btnIcon} />
          Pago Rápido
        </Button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCardWrapper}>
          <CardContent className={styles.kpiCard}>
            <div className={styles.iconBlue}>
              <Users size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Total Alumnos</span>
              <span className={styles.kpiValue}>{metricasInscripcion?.alumnosActivos || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.kpiCardWrapper}>
          <CardContent className={styles.kpiCard}>
            <div className={styles.iconGreen}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Ingresos de Hoy</span>
              <span className={styles.kpiValue}>
                {formatCurrency(Number(kpisFinanzas?.ingresosMesActual) || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.kpiCardWrapper}>
          <CardContent className={styles.kpiCard}>
            <div className={styles.iconRed}>
              <AlertTriangle size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Deudores Críticos</span>
              <span className={styles.kpiValue}>
                {formatCurrency(Number(kpisFinanzas?.deudaPendienteTotal) || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.kpiCardWrapper}>
          <CardContent className={styles.kpiCard}>
            <div className={styles.iconYellow}>
              <Medal size={24} />
            </div>
            <div className={styles.kpiData}>
              <span className={styles.kpiLabel}>Becas Activas</span>
              <span className={styles.kpiValue}>{0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intermediary Panels */}
      <div className={styles.panelsGrid}>
        {/* Últimos Pagos */}
        <Card className={styles.panelCard}>
          <CardHeader className={styles.panelHeader}>
            <div className={styles.panelTitleWrapper}>
              <Clock size={20} className={styles.panelIcon} />
              <CardTitle className={styles.panelTitle}>Últimos Pagos Registrados Hoy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className={styles.panelContent}>
            <div className={styles.emptyState}>
              <p>No se han registrado pagos el día de hoy.</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Deudores */}
        <Card className={styles.panelCard}>
          <CardHeader className={styles.panelHeader}>
            <div className={styles.panelTitleWrapper}>
              <AlertTriangle size={20} className={styles.panelIconDanger} />
              <CardTitle className={styles.panelTitle}>Top Deudores Críticos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className={styles.panelContent}>
            <div className={styles.emptyStateSuccess}>
              <p>Sin deudores.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Panel */}
      <Card className={styles.chartCard}>
        <CardHeader className={styles.panelHeader}>
          <div className={styles.panelTitleWrapper}>
            <BarChart3 size={20} className={styles.panelIcon} />
            <CardTitle className={styles.panelTitle}>Ingresos de los últimos 7 días</CardTitle>
          </div>
        </CardHeader>
        <CardContent className={styles.chartContent}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Ingresos']}
              />
              <Bar dataKey="ingresos" fill="var(--color-success)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
