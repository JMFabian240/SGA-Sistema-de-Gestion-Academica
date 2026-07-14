import { Users, AlertTriangle, TrendingUp, Award, CreditCard, BarChart3, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useAuthStore } from '../../../store/useAuthStore';
import { trpc } from '../../../lib/trpc';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase() || '';
  const isDocente = role == 'DOCENTE';
  const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';

  // Obtener datos vía tRPC
  const { data: metricasInscripcion, isLoading: loadingInscripcion } = trpc.dashboard.obtenerMetricasInscripcion.useQuery(undefined, { enabled: isAdmin });
  const { data: kpisFinancieros, isLoading: loadingKpis } = trpc.dashboard.obtenerKpisFinancieros.useQuery(undefined, { enabled: isAdmin });
  const { data: ingresosChartData, isLoading: loadingChart } = trpc.dashboard.obtenerIngresosUltimos7Dias.useQuery(undefined, { enabled: isAdmin });
  const { data: ultimosPagos, isLoading: loadingPagos } = trpc.dashboard.obtenerUltimosPagos.useQuery(undefined, { enabled: isAdmin });
  const { data: topDeudores, isLoading: loadingTopDeudores } = trpc.dashboard.obtenerTopDeudores.useQuery(undefined, { enabled: isAdmin });

  const loading = loadingInscripcion || loadingKpis || loadingChart || loadingPagos || loadingTopDeudores;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Panel Administrativo</h2>
          <p className="text-gray-500">Resumen operativo {isDocente ? 'académico' : 'y financiero del día'}</p>
        </div>
        {!isDocente && (
          <button
            onClick={() => navigate('/pagos')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#990000] text-white font-medium rounded-xl hover:bg-[#7a0000] transition-colors shadow-sm cursor-pointer"
          >
            <CreditCard size={18} /> Pago Rápido
          </button>
        )}
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isDocente ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-6`}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-0.5">Total Alumnos</h3>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : (metricasInscripcion?.alumnosActivos ?? 0)}
            </p>
          </div>
        </div>

        {!isDocente && (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-0.5">Ingresos de Hoy</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : `$${Number(kpisFinancieros?.ingresosMesActual ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-0.5">Deudores Críticos</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : `$${Number(kpisFinancieros?.deudaPendienteTotal ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-0.5">Becas Activas</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : 0}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {!isDocente && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Últimos Pagos Registrados Hoy */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[280px]">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-gray-500" size={18} />
                <h3 className="font-bold text-sm text-gray-800">Últimos Pagos Registrados Hoy</h3>
              </div>
              <div className="flex-1 space-y-0 divide-y divide-gray-100">
                {ultimosPagos && ultimosPagos.length > 0 ? (
                  ultimosPagos.map((pago, i) => (
                    <div key={i} className="flex justify-between items-center py-3">
                      <p className="text-xs font-bold text-gray-800 w-1/3">{pago.name}</p>
                      <p className="text-xs text-gray-400 w-1/3 text-center">{pago.type}</p>
                      <p className="text-xs font-bold text-emerald-500 w-1/3 text-right">{pago.amount}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[180px]">
                    <p className="text-gray-400 text-xs">No se han registrado pagos el día de hoy.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Deudores Críticos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="text-red-500" size={18} />
                <h3 className="font-bold text-sm text-gray-800">Top Deudores Críticos</h3>
              </div>
              <div className="flex-1 space-y-0 divide-y divide-gray-100">
                {topDeudores && topDeudores.length > 0 ? (
                  topDeudores.map((deudor, i) => (
                    <div key={i} className="flex justify-between items-center py-3">
                      <div className="w-2/3">
                        <p className="text-xs font-bold text-gray-800 truncate" title={deudor.nombreTutor}>{deudor.nombreTutor}</p>
                        <p className="text-[10px] text-gray-500 truncate">Tutor de: {deudor.nombreAlumno}</p>
                      </div>
                      <p className="text-xs font-bold text-red-500 w-1/3 text-right">
                        ${Number(deudor.deudaMonto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[180px]">
                    <p className="text-emerald-500 text-sm font-medium">Sin deudores críticos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráfica Full Width */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col mt-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-gray-600" size={20} />
              <h3 className="font-bold text-lg text-gray-800">Ingresos de los últimos 7 días</h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Total']}
                  />
                  <Bar dataKey="ingresos" radius={[6, 6, 0, 0]}>
                    {(ingresosChartData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.ingresos > 0 ? '#10b981' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
