import { FileText, AlertCircle } from 'lucide-react';
import type { CuentaPendiente } from '../hooks/useCajaPage';

interface PanelDeudoresProps {
  ultimosPagos: any[];
  topDeudores: any[];
  cuentasPendientes: CuentaPendiente[];
  nivelesOrdenados: [string, CuentaPendiente[]][];
  handleSelectAlumno: (alumnoId: number, tutorId?: number) => void;
}

export function PanelDeudores({
  ultimosPagos, topDeudores, cuentasPendientes, nivelesOrdenados, handleSelectAlumno
}: PanelDeudoresProps) {
  return (
    <div className="flex-1 overflow-y-auto mt-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historial de Tickets */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="text-emerald-500" />
            Últimos Tickets de Hoy
          </h2>
          <div className="space-y-4">
            {ultimosPagos.length === 0 ? (
              <div className="text-center text-slate-400 py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm font-medium">No hay pagos registrados hoy.</p>
              </div>
            ) : (
              ultimosPagos.map((pago, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                  <div className="w-2/3">
                    <p className="font-bold text-slate-800 text-sm truncate" title={pago.name}>{pago.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{pago.type}</p>
                  </div>
                  <div className="font-black text-emerald-600 text-right w-1/3">
                    {pago.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Atajo de Cobranza (Morosos) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Deudores
          </h2>
          <div className="space-y-4">
            {topDeudores.length === 0 ? (
              <div className="text-center text-slate-400 py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm font-medium text-emerald-600">¡Excelente! Sin deudores críticos.</p>
              </div>
            ) : (
              topDeudores.map((deudor: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100 hover:border-red-200 transition-colors">
                  <div className="w-2/3">
                    <p className="font-bold text-slate-800 text-sm truncate" title={deudor.nombreAlumno}>{deudor.nombreAlumno}</p>
                    <p className="text-[10px] text-slate-500 truncate mb-1">Tutor: {deudor.nombreTutor}</p>
                    <p className="font-black text-red-600 text-sm">
                      ${Number(deudor.deudaMonto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectAlumno(deudor.alumnoId, deudor.tutorId)}
                    className="px-4 py-3 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 shadow-md shadow-red-600/20 transition-all shrink-0"
                  >
                    COBRAR
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cuentas Pendientes Agrupadas */}
      <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FileText className="text-blue-500" />
          Cuentas con Saldo Pendiente
        </h2>

        {cuentasPendientes.length === 0 ? (
          <div className="text-center text-slate-400 py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-medium text-blue-600">No hay cuentas con saldos pendientes por cobrar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nivelesOrdenados.map(([nivel, cuentas], i) => (
              <details key={i} className="border border-slate-200 rounded-2xl overflow-hidden group bg-white shadow-sm" open={i === 0}>
                <summary className="bg-slate-50 px-5 py-4 font-bold text-slate-700 flex justify-between items-center cursor-pointer list-none select-none hover:bg-slate-100 transition-colors [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 group-open:rotate-90 transition-transform duration-200">▶</span>
                    <span className="text-lg">{nivel}</span>
                  </div>
                  <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-black">{cuentas.length}</span>
                </summary>
                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white border-t border-slate-100">
                  {cuentas.map((cuenta, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-blue-50/30 rounded-2xl border border-blue-100 hover:border-blue-300 transition-colors">
                      <div className="w-2/3">
                        <p className="font-bold text-slate-800 text-sm truncate" title={cuenta.nombreAlumno}>{cuenta.nombreAlumno}</p>
                        <p className="text-[10px] text-slate-500 truncate mb-1">Tutor: {cuenta.nombreTutor}</p>
                        <p className="font-black text-blue-600 text-sm">
                          ${Number(cuenta.deudaMonto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSelectAlumno(cuenta.alumnoId, cuenta.tutorId)}
                        className="px-4 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all shrink-0"
                      >
                        COBRAR
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
