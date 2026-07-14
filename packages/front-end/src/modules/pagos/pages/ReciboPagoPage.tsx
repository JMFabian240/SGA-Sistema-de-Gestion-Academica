import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '../../../lib/trpc';

export function ReciboPagoPage() {
  const { pagoId } = useParams();
  
  const { data: recibo, isLoading, isError } = trpc.pagos.getReciboPago.useQuery(
    { pagoId: Number(pagoId) },
    { enabled: !!pagoId }
  );

  useEffect(() => {
    if (recibo && !isLoading) {
      // Configuramos el título de la página para que el PDF se guarde con ese nombre
      const cleanName = recibo.alumno.nombreCompleto.replace(/\s+/g, '_').toUpperCase();
      document.title = `Recibo_SGA_${recibo.pagoId}_${cleanName}`;
      
      // Lanzamos la impresión después de un pequeñísimo retardo para asegurar el render de las imágenes
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [recibo, isLoading]);

  if (isLoading) return <div className="p-10 text-center font-bold text-slate-500">Cargando recibo...</div>;
  if (isError || !recibo) return <div className="p-10 text-center font-bold text-red-600">Error al cargar el recibo</div>;

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans max-w-2xl mx-auto print:p-0">
      {/* Esconder boton UI al imprimir mediante CSS print:hidden */}
      <div className="print:hidden mb-8 text-center">
        <button 
          onClick={() => window.print()} 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors"
        >
          Imprimir Recibo
        </button>
      </div>

      {/* Contenedor del recibo */}
      <div className="print:m-0">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo Colegio San Diego" className="w-32 h-32 object-contain mb-4" />
          <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">Colegio San Diego</h1>
          <h2 className="text-lg font-medium text-slate-600 mt-2">Recibo de Pago No. {recibo.pagoId}</h2>
        </div>

        <div className="border-t-2 border-slate-200 pt-6 mb-6">
          <div className="flex justify-between mb-4 text-base">
            <span className="text-slate-600">Fecha:</span>
            <span className="font-medium text-slate-800">
              {new Date(recibo.fechaPago).toLocaleString('es-MX', { 
                day: '2-digit', month: 'numeric', year: 'numeric', 
                hour: 'numeric', minute: '2-digit', second: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between mb-8 text-base">
            <span className="text-slate-600">Alumno:</span>
            <span className="font-medium text-slate-800 uppercase">{recibo.alumno.nombreCompleto}</span>
          </div>

          <div className="mb-4 text-base text-slate-600">Conceptos Pagados:</div>
          <div className="space-y-3 mb-8">
            {recibo.aplicacionesPago.map((app, idx) => {
              const conceptoStr = app.calendarioPago 
                ? `${app.calendarioPago.concepto}${app.calendarioPago.mes ? ` (${app.calendarioPago.mes})` : ''}`
                : 'Concepto no especificado';
              
              return (
                <div key={idx} className="flex justify-between text-base">
                  <span className="text-slate-800">{conceptoStr}</span>
                  <span className="text-slate-800">${Number(app.montoAplicado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              );
            })}
            
            <div className="flex justify-between text-base mt-6 pt-6 border-t border-slate-100">
              <span className="text-slate-600">Método de pago:</span>
              <span className="text-slate-800 capitalize">{recibo.metodoPago.toLowerCase()}</span>
            </div>
          </div>
        </div>

        <div className="border-t-4 border-slate-800 pt-6 flex justify-between items-center">
          <span className="font-bold text-xl text-slate-800">Total Pagado:</span>
          <span className="font-black text-2xl text-slate-900">${Number(recibo.montoTotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}
