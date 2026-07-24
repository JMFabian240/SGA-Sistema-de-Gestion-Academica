import { Search, User, ArrowLeft } from 'lucide-react';
import type { AlumnoSearch } from '../hooks/useCajaPage';

interface BuscadorAlumnosProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isBuscando: boolean;
  alumnosFiltrados: AlumnoSearch[];
  selectedAlumnoId: number | null;
  handleSelectAlumno: (alumnoId: number | null, tutorId?: number | null) => void;
}

export function BuscadorAlumnos({
  searchTerm, setSearchTerm, isBuscando, alumnosFiltrados, selectedAlumnoId, handleSelectAlumno
}: BuscadorAlumnosProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-4">
        {selectedAlumnoId && (
          <button 
            onClick={() => handleSelectAlumno(null, null)} 
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            title="Volver a la vista principal"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-2xl font-black text-slate-800">Punto de Cobro</h1>
      </div>

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

        {searchTerm.length > 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
            {isBuscando ? (
              <div className="p-4 text-center text-slate-500">Buscando...</div>
            ) : alumnosFiltrados.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No se encontraron alumnos</div>
            ) : (
              alumnosFiltrados.map((alumno: any) => (
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
  );
}
