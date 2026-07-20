import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

type FlujoImportacion = 'CATALOGO' | 'INSCRIPCIONES' | 'PAGOS' | 'SALDOS' | 'TODAS';

const FLUJOS = [
  { id: 'CATALOGO', nombre: 'Catálogo Académico', disponible: true },
  { id: 'INSCRIPCIONES', nombre: 'Inscripción de Alumnos', disponible: true },
  { id: 'PAGOS', nombre: 'Pagos Anteriores', disponible: true },
  { id: 'SALDOS', nombre: 'Saldos Iniciales', disponible: true },
  { id: 'TODAS', nombre: 'Todas (Solo Descarga)', disponible: true },
];

export function ImportacionDatosPanel(_props: { ciclos: any[] }) {
  const [flujoSeleccionado, setFlujoSeleccionado] = useState<FlujoImportacion>('CATALOGO');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null);

  const descargarArchivo = (cabeceras: string, filename: string) => {
    if (cabeceras) {
      const blob = new Blob(['\uFEFF' + cabeceras], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDescargarPlantilla = () => {
    const dataCatalogo = 'Tipo de Ciclo,Nivel Educativo,Grado,Nombre Grupo,Cupo Maximo\nANUAL,Primaria,1ro,A,30\nSEMESTRAL,Preparatoria,1ro,B,30';
    const dataInscripciones = 'Tipo de Ciclo,Matricula,CURP Alumno,Nombre Alumno,Fecha Nacimiento,Sexo,Estado Alumno,Nombre Tutor,Parentesco,Telefono Tutor,Correo Tutor,Nivel Educativo Destino,Grado Destino,Grupo Destino,Plan de Pago Asignado\nANUAL,2026-001,CURP1234567890ABCD,Juan Pérez Garcia,2010-05-14,M,ACTIVO,María Garcia,MADRE,5512345678,maria@ejemplo.com,Primaria,1ro,A,Plan Básico 10 Meses';
    const dataPagos = 'Tipo de Ciclo,Matricula,CURP Alumno,Nombre Alumno,Fecha Pago,Monto Total,Metodo Pago,Observaciones\nANUAL,2026-001,,Juan Pérez Garcia,2026-01-15,1500.50,TRANSFERENCIA,Pago adelantado';
    const dataSaldos = 'Tipo de Ciclo,Matricula,CURP Alumno,Nombre Alumno,Concepto,Mes,Fecha Vencimiento,Monto Original,Monto Pagado,Estado Cobro\nANUAL,2026-001,,Juan Pérez Garcia,Colegiatura,Septiembre,2026-09-10,1500.00,0,PENDIENTE';

    if (flujoSeleccionado === 'CATALOGO') {
      descargarArchivo(dataCatalogo, 'Plantilla_Catalogo_Academico.csv');
    } else if (flujoSeleccionado === 'INSCRIPCIONES') {
      descargarArchivo(dataInscripciones, 'Plantilla_Inscripcion_Alumnos.csv');
    } else if (flujoSeleccionado === 'PAGOS') {
      descargarArchivo(dataPagos, 'Plantilla_Pagos_Anteriores.csv');
    } else if (flujoSeleccionado === 'SALDOS') {
      descargarArchivo(dataSaldos, 'Plantilla_Saldos_Iniciales.csv');
    } else if (flujoSeleccionado === 'TODAS') {
      descargarArchivo(dataCatalogo, 'Plantilla_Catalogo_Academico.csv');
      setTimeout(() => descargarArchivo(dataInscripciones, 'Plantilla_Inscripcion_Alumnos.csv'), 300);
      setTimeout(() => descargarArchivo(dataPagos, 'Plantilla_Pagos_Anteriores.csv'), 600);
      setTimeout(() => descargarArchivo(dataSaldos, 'Plantilla_Saldos_Iniciales.csv'), 900);
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

    setSubiendo(true);
    setResultado(null);

    const formData = new FormData();
    formData.append('file', archivo);

    try {
      let endpoint = '/api/importaciones/catalogo';
      if (flujoSeleccionado === 'INSCRIPCIONES') {
        endpoint = '/api/importaciones/inscripciones';
      } else if (flujoSeleccionado === 'PAGOS') {
        endpoint = '/api/importaciones/pagos';
      } else if (flujoSeleccionado === 'SALDOS') {
        endpoint = '/api/importaciones/saldos';
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
              {flujoSeleccionado === 'TODAS' ? 'Descargar Todas las Plantillas' : 'Descargar Plantilla CSV'}
            </Button>
          </div>
        </div>

        <div className="space-y-4 flex flex-col">
          <label className="block text-sm font-semibold text-navy-800 mb-1">Archivo CSV</label>

          <div className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-colors relative ${flujoSeleccionado === 'TODAS' ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 cursor-pointer'}`}>
            {flujoSeleccionado === 'TODAS' ? (
              <div className="flex flex-col items-center">
                 <AlertTriangle className="text-gray-400 mb-3" size={32} />
                 <span className="text-sm font-bold text-gray-600">Selecciona un flujo específico</span>
                 <span className="text-xs text-gray-500 mt-1">Para subir un archivo debes seleccionar un módulo</span>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="text-gray-400 mb-3" size={32} />
                {archivo ? (
                  <div className="flex flex-col items-center relative z-10">
                    <span className="text-sm font-bold text-navy-600 mb-2">{archivo.name}</span>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setArchivo(null);
                        setResultado(null);
                      }}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
                    >
                      <XCircle size={14} className="mr-1" /> Eliminar
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-bold text-gray-700">Haz clic o arrastra un archivo aquí</span>
                    <span className="text-xs text-gray-500 mt-1">Formato soportado: .csv</span>
                  </>
                )}
              </>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleSubirArchivo}
            disabled={!archivo || subiendo || flujoSeleccionado === 'TODAS'}
            className="w-full justify-center py-2.5"
          >
            {subiendo ? (
              <><RefreshCw className="animate-spin mr-2" size={16} /> Procesando...</>
            ) : (
              'Subir e Importar'
            )}
          </Button>

          {resultado && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-2 ${resultado.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
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
