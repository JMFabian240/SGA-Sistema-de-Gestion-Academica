import { X, Search, Link } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { useState, useMemo } from 'react';

interface VincularAlumnoModalProps {
  isOpen: boolean;
  tutorId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function VincularAlumnoModal({ isOpen, tutorId, onClose, onSuccess }: VincularAlumnoModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: alumnos, isLoading } = trpc.alumnos.getAll.useQuery(undefined, { enabled: isOpen });
  const linkTutorMutation = trpc.alumnos.linkTutor.useMutation();

  const handleVincular = async (alumnoId: number) => {
    try {
      await linkTutorMutation.mutateAsync({
        alumnoId,
        tutorId,
        esPrincipal: true, // Al vincularlo, se vuelve su tutor de contacto principal
        parentesco: 'Tutor',
      });
      onSuccess();
    } catch (error) {
      console.error('Error al vincular alumno:', error);
      alert('Ocurrió un error al vincular el alumno.');
    }
  };

  const filteredAlumnos = useMemo(() => {
    if (!alumnos) return [];
    return alumnos.filter((a: any) => 
      a.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.matricula && a.matricula.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [alumnos, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Vincular Alumno Existente</h2>
            <p className="text-sm text-gray-500 mt-1">Selecciona un alumno de la lista para vincularlo al tutor.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium text-xs">
                <tr>
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Matrícula</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      Cargando alumnos...
                    </td>
                  </tr>
                ) : filteredAlumnos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No se encontraron alumnos.
                    </td>
                  </tr>
                ) : (
                  filteredAlumnos.map((alumno: any) => (
                    <tr key={alumno.alumnoId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {alumno.nombreCompleto}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {alumno.matricula || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleVincular(alumno.alumnoId)}
                          disabled={linkTutorMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Link size={14} /> Vincular
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
