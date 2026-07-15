import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

type FlujoImportacion = 'CATALOGO' | 'INSCRIPCIONES' | 'PAGOS' | 'SALDOS';

const FLUJOS = [
  { id: 'CATALOGO', nombre: 'Catálogo Académico', disponible: true },
  { id: 'INSCRIPCIONES', nombre: 'Inscripción de Alumnos', disponible: true },
  { id: 'PAGOS', nombre: 'Pagos Anteriores', disponible: true },
  { id: 'SALDOS', nombre: 'Saldos Iniciales', disponible: true },
];

export function ImportacionDatosPanel({ ciclos }: { ciclos: any[] }) {
  const [flujoSeleccionado, setFlujoSeleccionado] = useState<FlujoImportacion>('CATALOGO');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cicloId, setCicloId] = useState<number | ''>('');
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null);

  const handleDescargarPlantilla = () => {
    let cabeceras = '';
    let filename = '';
    if (flujoSeleccionado === 'CATALOGO') {
      cabeceras = 'Nivel Educativo,Grado,Nombre Grupo,Cupo Máximo\nPrimaria,1ro,A,30\nPrimaria,1ro,B,30';
      filename = 'Plantilla_Catalogo_Academico.csv';
    } else if (flujoSeleccionado === 'INSCRIPCIONES') {
      cabeceras = 'Matrícula,CURP Alumno,Nombre Alumno,Fecha Nacimiento,Sexo,Estado Alumno,Nombre Tutor,Parentesco,Teléfono Tutor,Correo Tutor,Nivel Educativo Destino,Grado Destino,Grupo Destino\n2026-001,CURP1234567890ABCD,Juan Pérez Garcia,2010-05-14,M,ACTIVO,María Garcia,MADRE,5512345678,maria@ejemplo.com,Primaria,1ro,A';
      filename = 'Plantilla_Inscripcion_Alumnos.csv';
    } else if (flujoSeleccionado === 'PAGOS') {
      cabeceras = 'Matrícula,CURP Alumno,Nombre Alumno,Fecha Pago,Monto Total,Método Pago,Observaciones\n2026-001,,Juan Pérez Garcia,2026-01-15,1500.50,TRANSFERENCIA,Pago adelantado';
      filename = 'Plantilla_Pagos_Anteriores.csv';
    } else if (flujoSeleccionado === 'SALDOS') {
      cabeceras = 'Matrícula,CURP Alumno,Nombre Alumno,Concepto,Mes,Fecha Vencimiento,Monto Original,Monto Pagado,Estado Cobro\n2026-001,,Juan Pérez Garcia,Colegiatura,Septiembre,2026-09-10,1500.00,0,PENDIENTE';
      filename = 'Plantilla_Saldos_Iniciales.csv';
    }

    if (cabeceras) {
      const blob = new Blob([cabeceras], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
      setResultado(null);
    }
  };

  const handleSubirArchivo = async () => {
    if (!archivo) return;
    if (['CATALOGO', 'INSCRIPCIONES', 'PAGOS', 'SALDOS'].includes(flujoSeleccionado) && !cicloId) {
       setResultado({ success: false, message: 'Selecciona un ciclo escolar para continuar.' });
       return;
    }

    setSubiendo(true);
    setResultado(null);

    const formData = new FormData();
    formData.append('file', archivo);
    
    if (cicloId) {
      formData.append('cicloId', cicloId.toString());
    }

    try {
      let endpoint = 'http://localhost:3000/api/importaciones/catalogo';
      if (flujoSeleccionado === 'INSCRIPCIONES') {
        endpoint = 'http://localhost:3000/api/importaciones/inscripciones';
      } else if (flujoSeleccionado === 'PAGOS') {
        endpoint = 'http://localhost:3000/api/importaciones/pagos';
      } else if (flujoSeleccionado === 'SALDOS') {
        endpoint = 'http://localhost:3000/api/importaciones/saldos';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok || !data.ok) {
        setResultado({ success: false, message: data.message || 'Error desconocido al importar.' });
      } else {
        setResultado({ success: true, message: data.message });
        setArchivo(null);
      }
    } catch (error: any) {
      setResultado({ success: false, message: `Error de red: ${error.message}` });
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-navy-800 flex items-center gap-2">
          <UploadCloud className="text-blue-600" /> Importación de Datos
        </h3>
        <p className="text-xs text-gray-500 mt-1">Sube archivos CSV para importar datos masivos al sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-800 mb-1">Flujo de Importación</label>
            <select
              value={flujoSeleccionado}
              onChange={(e) => setFlujoSeleccionado(e.target.value as FlujoImportacion)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-blue-500"
            >
              {FLUJOS.map(f => (
                <option key={f.id} value={f.id} disabled={!f.disponible}>
                  {f.nombre} {!f.disponible && '(Próximamente)'}
                </option>
              ))}
            </select>
          </div>

          {['CATALOGO', 'INSCRIPCIONES', 'PAGOS', 'SALDOS'].includes(flujoSeleccionado) && (
            <div>
              <label className="block text-sm font-semibold text-navy-800 mb-1">Ciclo Escolar Destino</label>
              <select
                value={cicloId}
                onChange={(e) => setCicloId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Selecciona un ciclo</option>
                {ciclos?.map((c: any) => (
                  <option key={c.cicloId} value={c.cicloId}>{c.nombre} {c.activo ? '(Activo)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
              <FileSpreadsheet size={16} /> Instrucciones
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed mb-3">
              Descarga la plantilla, llénala sin modificar los encabezados y súbela. El sistema validará 
              todos los registros y si existe algún error, rechazará el archivo completo para mantener la integridad.
            </p>
            <Button
              variant="outline"
              onClick={handleDescargarPlantilla}
              className="text-xs w-full justify-center bg-white"
            >
              Descargar Plantilla CSV
            </Button>
          </div>
        </div>

        <div className="space-y-4 flex flex-col">
          <label className="block text-sm font-semibold text-navy-800 mb-1">Archivo CSV</label>
          
          <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center p-6 text-center hover:bg-gray-100 transition-colors relative">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="text-gray-400 mb-3" size={32} />
            {archivo ? (
              <span className="text-sm font-bold text-navy-600">{archivo.name}</span>
            ) : (
              <>
                <span className="text-sm font-bold text-gray-700">Haz clic o arrastra un archivo aquí</span>
                <span className="text-xs text-gray-500 mt-1">Formato soportado: .csv</span>
              </>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleSubirArchivo}
            disabled={!archivo || subiendo}
            className="w-full justify-center py-2.5"
          >
            {subiendo ? (
              <><RefreshCw className="animate-spin mr-2" size={16} /> Procesando...</>
            ) : (
              'Subir e Importar'
            )}
          </Button>

          {resultado && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-2 ${
              resultado.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {resultado.success ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
              <span className="leading-tight">{resultado.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
