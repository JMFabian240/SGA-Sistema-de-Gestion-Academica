import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { ChevronLeft, User, Phone, Mail, MapPin, Building2, Crown, GraduationCap, Link2Off, Plus } from 'lucide-react';
import { VincularAlumnoModal } from '../components/VincularAlumnoModal';

export function ExpedienteTutorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);

  const tutorId = parseInt(id || '0', 10);
  const utils = trpc.useUtils();
  
  const { data: tutor, isLoading, error } = trpc.tutores.getById.useQuery(tutorId, {
    enabled: !!tutorId,
  });

  const unlinkTutorMutation = trpc.alumnos.unlinkTutor.useMutation({
    onSuccess: () => {
      utils.tutores.getById.invalidate(tutorId);
    }
  });

  const handleUnlink = (tutorAlumnoId: number) => {
    if (window.confirm('¿Estás seguro de que deseas desvincular a este alumno?')) {
      unlinkTutorMutation.mutate({ tutorAlumnoId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001429]"></div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
        <p>No se pudo cargar el expediente del tutor.</p>
        <button 
          onClick={() => navigate('/tutores')}
          className="mt-4 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Volver al directorio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={() => navigate('/tutores')}
          className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors mt-1"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tutor.nombreCompleto}</h1>
          <p className="text-gray-500 mt-1">Expediente del responsable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Información Personal y Fiscal */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Información Personal */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="text-blue-500" size={20} />
              Información de Contacto
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">CURP</p>
                <p className="font-medium text-gray-900">{tutor.curp || 'No especificada'}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{tutor.telefono || 'Sin teléfono'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Correo Electrónico</p>
                  <p className="font-medium text-gray-900 truncate max-w-[200px]" title={tutor.correoElectronico || ''}>
                    {tutor.correoElectronico || 'Sin correo'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900">{tutor.direccion || 'Sin dirección'}</p>
                </div>
              </div>
              {tutor.tipoPagoHabitual && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Forma de pago habitual</p>
                  <p className="font-medium text-gray-900">{tutor.tipoPagoHabitual}</p>
                </div>
              )}
            </div>
          </div>

          {/* Datos Fiscales */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="text-orange-500" size={20} />
              Datos de Facturación
            </h2>
            {tutor.datosFiscales ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Razón Social</p>
                  <p className="font-medium text-gray-900">{tutor.datosFiscales.razonSocial}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">RFC</p>
                    <p className="font-medium text-gray-900">{tutor.datosFiscales.rfc}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">C.P.</p>
                    <p className="font-medium text-gray-900">{tutor.datosFiscales.codigoPostal || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Régimen Fiscal</p>
                  <p className="font-medium text-gray-900 text-sm">{tutor.datosFiscales.regimenFiscal || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Uso CFDI</p>
                  <p className="font-medium text-gray-900 text-sm">{tutor.datosFiscales.usoCfdi || 'No especificado'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">Este tutor no requiere factura</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Alumnos a cargo */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="text-indigo-500" size={20} />
                Alumnos a Cargo
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-2">
                  {tutor.tutoresAlumnos?.length || 0} alumno(s)
                </span>
              </div>
              <button
                onClick={() => setIsVincularModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors text-sm"
              >
                <Plus size={16} /> Vincular alumno
              </button>
            </h2>

            <div className="space-y-4">
              {tutor.tutoresAlumnos && tutor.tutoresAlumnos.length > 0 ? (
                tutor.tutoresAlumnos.map((relacion: any) => {
                  const a = relacion.alumno;
                  const inscripcion = a.inscripciones?.[0];
                  const gradoNombre = inscripcion?.grupo?.grado?.nombre || a.grado?.nombre || '';
                  const grupoNombre = inscripcion?.grupo?.nombre || '';
                  const nivelNombre = a.nivel?.nombre || '';
                  
                  let grupoNivel = 'Grado sin asignar';
                  if (gradoNombre || grupoNombre || nivelNombre) {
                    const partes = [];
                    if (gradoNombre) partes.push(gradoNombre);
                    const grupoNivelText = `${grupoNombre} ${nivelNombre}`.trim();
                    if (grupoNivelText) partes.push(grupoNivelText);
                    grupoNivel = partes.join(' - ');
                  }

                  return (
                    <div 
                      key={relacion.tutorAlumnoId} 
                      onClick={() => navigate(`/alumnos/${a.alumnoId}`)}
                      className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {a.nombreCompleto}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">Matrícula: {a.matricula || '-'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-full">
                            {relacion.parentesco}
                          </span>
                          {relacion.esPrincipal && (
                            <span title="Tutor Principal">
                              <Crown size={18} className="text-amber-500" />
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink(relacion.tutorAlumnoId);
                            }}
                            disabled={unlinkTutorMutation.isPending}
                            title="Desvincular alumno"
                            className="p-1.5 ml-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                          >
                            <Link2Off size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700">
                          {grupoNivel}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No tiene alumnos vinculados.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {isVincularModalOpen && (
        <VincularAlumnoModal
          isOpen={isVincularModalOpen}
          tutorId={tutorId}
          onClose={() => setIsVincularModalOpen(false)}
          onSuccess={() => {
            setIsVincularModalOpen(false);
            utils.tutores.getById.invalidate(tutorId);
          }}
        />
      )}
    </div>
  );
}
