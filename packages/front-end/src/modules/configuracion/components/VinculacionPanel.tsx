import { QRCodeSVG } from 'qrcode.react';
import { trpc } from '../../../lib/trpc';
import { Copy, Wifi, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function VinculacionPanel() {
  const { data: networkInfo, isLoading } = trpc.configuracion.getServerNetworkInfo.useQuery();

  const getUrl = () => {
    if (!networkInfo) return '';
    return `http://${networkInfo.ip}:${networkInfo.port}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      toast.success('Enlace copiado al portapapeles');
    } catch (err) {
      toast.error('No se pudo copiar el enlace');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Obteniendo información de red...</div>;
  }

  const url = getUrl();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Conexión en Red Local</h3>
            <p className="text-sm text-slate-500">Comparte este enlace para que otras computadoras (cajas, docentes) accedan al sistema.</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 mt-6">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <p className="text-sm font-semibold text-slate-700">Enlace de Acceso (URL)</p>
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <code className="px-4 py-2 bg-white rounded-md border border-slate-200 text-blue-700 font-mono text-lg font-bold select-all">
                {url}
              </code>
              <button 
                onClick={copyToClipboard}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100"
                title="Copiar Enlace"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center justify-center md:justify-start">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" />
              El servidor web interno está escuchando peticiones en la red local.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
            <QRCodeSVG value={url} size={130} level="M" />
            <span className="text-[10px] text-slate-400 mt-2 font-semibold uppercase tracking-wider">Código QR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
