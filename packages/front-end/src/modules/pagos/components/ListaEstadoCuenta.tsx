import { User, AlertCircle, PlusCircle, CheckSquare, Square } from 'lucide-react';
import type { Adeudo, AlumnoSeleccionado } from '../hooks/useCajaPage';

interface ListaEstadoCuentaProps {
  alumnoSeleccionado?: AlumnoSeleccionado | null;
  isLoadingAlumno: boolean;
  adeudos: Adeudo[];
  isLoadingAdeudos: boolean;
  adeudosSeleccionados: Adeudo[];
  toggleAdeudo: (a: Adeudo) => void;
  toggleAll: () => void;
  onOpenCargoModal: () => void;
  onApplyRecargo: (adeudoId: number) => void;
}

export function ListaEstadoCuenta({
  alumnoSeleccionado, isLoadingAlumno, adeudos, isLoadingAdeudos, adeudosSeleccionados, toggleAdeudo, toggleAll, onOpenCargoModal, onApplyRecargo
}: ListaEstadoCuentaProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <User size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg leading-tight truncate max-w-[300px]" title={alumnoSeleccionado?.nombreCompleto}>
              {isLoadingAlumno ? 'Cargando alumno...' : (alumnoSeleccionado?.nombreCompleto || 'Alumno no encontrado')}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {alumnoSeleccionado?.nivel?.nombre || 'Sin Nivel'} • {alumnoSeleccionado?.grado?.nombre || 'Sin Grado'}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenCargoModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl transition-colors text-sm"
        >
          <PlusCircle size={18} />
          Cargo Extra
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {isLoadingAdeudos ? (
          <div className="text-center text-slate-500 py-10">Cargando adeudos...</div>
        ) : adeudos.length === 0 ? (
          <div className="text-center flex flex-col items-center justify-center h-full text-slate-400">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p>Este alumno no tiene adeudos pendientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-4 hover:text-blue-800"
            >
              {adeudosSeleccionados.length === adeudos.filter(a => a.estadoCobro === 'PENDIENTE').length
                ? 'Desmarcar todos' : 'Marcar todos'}
            </button>

            {adeudos.map(adeudo => {
              const isSelected = adeudosSeleccionados.some(a => a.calendarioPagoId === adeudo.calendarioPagoId);
              const isPagado = adeudo.estadoCobro === 'PAGADO';
              const isVencido = new Date(adeudo.fechaVencimiento) < new Date() && !isPagado;

              return (
                <div
                  key={adeudo.calendarioPagoId}
                  onClick={() => !isPagado && toggleAdeudo(adeudo)}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${isPagado ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' :
                    isSelected ? 'bg-blue-50 border-blue-400 cursor-pointer shadow-sm' :
                      'bg-white border-slate-100 hover:border-blue-200 cursor-pointer'
                    }`}
                >
                  <div className={`shrink-0 ${isPagado ? 'text-slate-300' : isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                    {isPagado ? <CheckSquare size={24} /> : isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {adeudo.concepto}
                      {isVencido && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-md">Vencido</span>}
                    </div>
                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                      <span>Vence: {new Date(adeudo.fechaVencimiento).toLocaleDateString()}</span>
                      {isVencido && Number(adeudo.montoRecargo) === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('¿Deseas aplicar el recargo configurado a este adeudo?')) {
                              onApplyRecargo(adeudo.calendarioPagoId);
                            }
                          }}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors"
                        >
                          Aplicar Recargo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className={`font-black text-lg ${isPagado ? 'text-slate-400' : 'text-slate-800'}`}>
                      ${Number(adeudo.saldoPendiente).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {Number(adeudo.montoRecargo) > 0 && !isPagado && (
                        <div className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md inline-block border border-red-100">
                          Recargo Aplicado
                        </div>
                      )}
                      {Number(adeudo.montoPagado) > 0 && !isPagado && (
                        <div className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                          Abonado: ${Number(adeudo.montoPagado).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
