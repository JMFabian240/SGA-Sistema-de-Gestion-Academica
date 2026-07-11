import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Search, User, FileText, AlertCircle, PlusCircle, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { TicketCheckout } from '../components/TicketCheckout';
import { NuevoCargoModal } from '../components/NuevoCargoModal';

export function CajaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);

  const [adeudosSeleccionados, setAdeudosSeleccionados] = useState<any[]>([]);
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);

  // Queries para Dashboard de Caja
  const { data: topDeudores = [] } = trpc.dashboard.obtenerTopDeudores.useQuery(undefined, { enabled: !selectedAlumnoId });
  const { data: ultimosPagos = [] } = trpc.dashboard.obtenerUltimosPagos.useQuery(undefined, { enabled: !selectedAlumnoId });
  const { data: cuentasPendientes = [] } = trpc.dashboard.obtenerCuentasPendientes.useQuery(undefined, { enabled: !selectedAlumnoId });

  // 1. Buscador de Alumnos
  const { data: alumnos = [], isLoading: isBuscando } = trpc.alumnos.getAll.useQuery(undefined, {
    enabled: searchTerm.length > 2,
  });

  // Filtrar en memoria por simplicidad para la UI rápida
  const alumnosFiltrados = searchTerm.length > 2
    ? alumnos.filter(a =>
      a.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];

  // Agrupar cuentas pendientes por nivel educativo
  const cuentasPorNivel = cuentasPendientes.reduce((acc, cuenta) => {
    const nivel = (cuenta as any).nivelNombre || 'Sin Nivel';
    if (!acc[nivel]) {
      acc[nivel] = [];
    }
    acc[nivel].push(cuenta);
    return acc;
  }, {} as Record<string, typeof cuentasPendientes>);

  // Ordenar niveles (Preescolar, Primaria, Secundaria, Bachillerato)
  const nivelesOrdenados = Object.entries(cuentasPorNivel).sort(([nivelA], [nivelB]) => {
    const getPeso = (n: string) => {
      const nom = n.toLowerCase();
      if (nom.includes('preescolar')) return 1;
      if (nom.includes('primaria')) return 2;
      if (nom.includes('secundaria')) return 3;
      if (nom.includes('bachiller')) return 4;
      return 99;
    };
    return getPeso(nivelA) - getPeso(nivelB);
  });

  // 2. Traer los adeudos del alumno seleccionado
  const { data: adeudos = [], isLoading: isLoadingAdeudos, refetch: refetchAdeudos } = trpc.pagos.getAdeudos.useQuery(
    { alumnoId: selectedAlumnoId! },
    { enabled: !!selectedAlumnoId }
  );

  // Al seleccionar un alumno
  const handleSelectAlumno = (alumnoId: number, tutorId?: number | null) => {
    setSelectedAlumnoId(alumnoId);
    setSelectedTutorId(tutorId || null);
    setSearchTerm('');
    setAdeudosSeleccionados([]);
  };

  // Toggle de un adeudo
  const toggleAdeudo = (adeudo: any) => {
    const isSelected = adeudosSeleccionados.some(a => a.calendarioPagoId === adeudo.calendarioPagoId);
    if (isSelected) {
      setAdeudosSeleccionados(prev => prev.filter(a => a.calendarioPagoId !== adeudo.calendarioPagoId));
    } else {
      setAdeudosSeleccionados(prev => [...prev, adeudo]);
    }
  };

  // Marcar todos
  const toggleAll = () => {
    const pendientes = adeudos.filter(a => a.estadoCobro === 'PENDIENTE');
    if (adeudosSeleccionados.length === pendientes.length) {
      setAdeudosSeleccionados([]); // Desmarcar todos
    } else {
      setAdeudosSeleccionados(pendientes); // Marcar todos
    }
  };

  const handleCheckoutSuccess = () => {
    setAdeudosSeleccionados([]);
    refetchAdeudos(); // Recargar el estado de cuenta
  };

  const alumnoSeleccionado = alumnos.find(a => a.alumnoId === selectedAlumnoId);

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">

      {/* HEADER: Buscador Global */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 mb-4">Punto de Cobro</h1>

        <div className="relative z-20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input
              type="text"
              placeholder="Buscar alumno por nombre, apellidos o matrícula..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Dropdown Resultados */}
          {searchTerm.length > 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
              {isBuscando ? (
                <div className="p-4 text-center text-slate-500">Buscando...</div>
              ) : alumnosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No se encontraron alumnos</div>
              ) : (
                alumnosFiltrados.map(alumno => (
                  <button
                    key={alumno.alumnoId}
                    onClick={() => handleSelectAlumno(alumno.alumnoId, alumno.tutoresAlumnos?.[0]?.tutorId)}
                    className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 flex items-center gap-4 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{alumno.nombreCompleto}</div>
                      <div className="text-xs text-slate-500 flex gap-2">
                        <span>{alumno.matricula || 'Sin Matrícula'}</span>
                        <span>•</span>
                        <span>Tutor: {alumno.tutoresAlumnos?.[0]?.tutor?.nombreCompleto || 'No asignado'}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* CUERPO PRINCIPAL */}
      {selectedAlumnoId ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">

          {/* Lado Izquierdo: Estado de Cuenta */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg leading-tight truncate max-w-[300px]" title={alumnoSeleccionado?.nombreCompleto}>
                    {alumnoSeleccionado?.nombreCompleto || 'Cargando alumno...'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    {alumnoSeleccionado?.nivel?.nombre || 'Sin Nivel'} • {alumnoSeleccionado?.grado?.nombre || 'Sin Grado'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const cicloExtraId = alumnoSeleccionado?.inscripciones?.[0]?.cicloId || adeudos?.[0]?.cicloId;
                  if (!cicloExtraId) {
                    toast.error('El alumno seleccionado no tiene un ciclo escolar activo ni adeudos previos. No se puede crear un cargo extra.');
                    return;
                  }
                  setIsCargoModalOpen(true);
                }}
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
                          <div className="text-sm text-slate-500 mt-1">
                            Vence: {new Date(adeudo.fechaVencimiento).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`font-black text-lg ${isPagado ? 'text-slate-400' : 'text-slate-800'}`}>
                            ${Number(adeudo.saldoPendiente).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          {Number(adeudo.montoPagado) > 0 && !isPagado && (
                            <div className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">
                              Abonado: ${Number(adeudo.montoPagado).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Lado Derecho: Checkout */}
          <div className="h-full">
            <TicketCheckout
              alumnoId={selectedAlumnoId}
              tutorId={selectedTutorId}
              adeudosSeleccionados={adeudosSeleccionados}
              onCheckoutSuccess={handleCheckoutSuccess}
            />
          </div>

        </div>
      ) : (
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
                  topDeudores.map((deudor, idx) => (
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
      )}

      {/* Modal de Cargo */}
      {selectedAlumnoId && (
        <NuevoCargoModal
          isOpen={isCargoModalOpen}
          onClose={() => setIsCargoModalOpen(false)}
          alumnoId={selectedAlumnoId}
          cicloId={alumnoSeleccionado?.inscripciones?.[0]?.cicloId || adeudos?.[0]?.cicloId || 0}
        />
      )}
    </div>
  );
}
