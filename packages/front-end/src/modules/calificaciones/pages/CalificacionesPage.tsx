import { useState, useCallback, useEffect } from 'react';
import { BookOpen, ChevronDown, Loader2, Save, Award, Users, Layers, MousePointerClick, CheckCircle2 } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GrupoMateria {
  grupoMateriaId: number;
  materia: { materiaId: number; nombre: string };
}

interface Grupo {
  grupoId: number;
  nombre: string;
  grado: { numero: number; nombre: string };
  nivel: { nombre: string };
  ciclo: { nombre: string; activo: boolean | null };
  materias: GrupoMateria[];
}

interface AlumnoInscrito {
  alumnoId: number;
  nombreCompleto: string;
  matricula: string | null;
}

// Periodos fijos (1 = 1er Trimestre, 2 = 2do, 3 = 3er)
const PERIODOS = [
  { id: 1, label: 'Trimestre 1' },
  { id: 2, label: 'Trimestre 2' },
  { id: 3, label: 'Trimestre 3' },
];

// ─── Celda de Calificación editable ──────────────────────────────────────────

interface CalifCeldaProps {
  alumnoId: number;
  grupoMateriaId: number;
  periodoId: number;
  initialValue: string;
  onSaved: () => void;
}

function CalifCelda({ alumnoId, grupoMateriaId, periodoId, initialValue, onSaved }: CalifCeldaProps) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(!!initialValue);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setValue(initialValue);
      setSaved(!!initialValue);
    }
  }, [initialValue, dirty]);

  const upsertMutation = trpc.calificaciones.upsert.useMutation({
    onSuccess: () => {
      setSaved(true);
      setDirty(false);
      onSaved();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setSaved(false);
    setDirty(true);
  };

  const handleBlur = () => {
    if (!dirty) return;
    const num = parseFloat(value);
    if (value === '' || isNaN(num) || num < 0 || num > 10) {
      if (value !== '') {
        toast.error('Calificación debe ser entre 0 y 10');
        setValue(initialValue);
        setDirty(false);
      }
      return;
    }
    upsertMutation.mutate({
      alumnoId,
      grupoMateriaId,
      periodoId,
      tipoEvaluacion: 'TRIMESTRE' as const,
      valorNumerico: num,
      cuentaParaPromedio: true,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const isSaving = upsertMutation.isLoading;
  const low = saved && value !== '' && parseFloat(value) < 6;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        min={0}
        max={10}
        step={0.1}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        style={{
          width: 80,
          padding: '8px 12px',
          border: `1.5px solid ${dirty ? '#f59e0b' : (saved && low ? '#fca5a5' : '#e2e8f0')}`,
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
          background: '#fff',
          color: low ? '#dc2626' : '#1e293b',
          outline: 'none',
          transition: 'border-color .15s',
        }}
        placeholder="-"
      />
      {isSaving && <Loader2 size={14} style={{ position: 'absolute', right: -20, color: '#94a3b8', animation: 'spin 1s linear infinite' }} />}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcularPromedio(califs: Record<number, string>): string {
  const vals = Object.values(califs).map(Number).filter((n) => !isNaN(n) && n >= 0);
  if (vals.length === 0) return '—';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CalificacionesPage() {
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState<number | null>(null);
  const [materiaSelecionadaId, setMateriaSeleccionadaId] = useState<number | null>(null); // grupoMateriaId
  const [, setSavedTick] = useState(0); // forzar refetch de calificaciones

  const { data: grupos, isLoading: loadingGrupos } = trpc.grupos.getGrupos.useQuery(undefined);

  const grupoActual: Grupo | undefined = (grupos as Grupo[] | undefined)?.find(
    (g) => g.grupoId === grupoSeleccionadoId
  );

  // Alumnos inscritos en el grupo activo (desde sus inscripciones)
  const { data: calificacionesExistentes, refetch: refetchCalifs } = trpc.calificaciones.getPorGrupo.useQuery(
    { grupoMateriaId: materiaSelecionadaId ?? 0 },
    { enabled: !!materiaSelecionadaId }
  );

  // Alumnos del grupo activo
  const { data: alumnos, isLoading: loadingAlumnos } = trpc.alumnos.getAll.useQuery();

  const alumnosDelGrupo: AlumnoInscrito[] = ((alumnos ?? []) as Array<{
    alumnoId: number;
    nombreCompleto: string;
    matricula: string | null;
    inscripciones: Array<{ grupo: { grupoId: number } | null; estadoEnCiclo: string; ciclo?: { activo: boolean | null } }>;
  }>)
    .filter((al) =>
      al.inscripciones?.some((i) => i.grupo?.grupoId === grupoSeleccionadoId)
    )
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

  // Mapa de calificaciones existentes: alumnoId → periodoId → valorNumerico
  const califMap: Record<number, Record<number, string>> = {};
  (calificacionesExistentes ?? []).forEach((c: any) => {
    if (!califMap[c.alumnoId]) califMap[c.alumnoId] = {};
    califMap[c.alumnoId][c.periodoId] = c.valorNumerico != null ? String(c.valorNumerico) : '';
  });

  const handleSaved = useCallback(() => {
    setSavedTick((t) => t + 1);
    refetchCalifs();
  }, [refetchCalifs]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={24} style={{ color: '#3b82f6' }} /> Sábana de Calificaciones
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Selecciona un grupo y una materia para evaluar a todo el salón.
        </p>
      </div>

      {/* Selectores */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 16,
        background: '#fff',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Selector de Grupo */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.5px' }}>
            1. SELECCIONAR GRUPO
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={grupoSeleccionadoId ?? ''}
              onChange={(e) => {
                setGrupoSeleccionadoId(Number(e.target.value) || null);
                setMateriaSeleccionadaId(null);
              }}
              style={{
                width: '100%',
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                padding: '10px 36px 10px 12px',
                fontSize: 14,
                fontWeight: 500,
                background: '#fff',
                color: '#1e293b',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Selecciona un grupo...</option>
              {loadingGrupos ? (
                <option disabled>Cargando grupos...</option>
              ) : (
                (grupos as Grupo[] | undefined)?.map((g) => (
                  <option key={g.grupoId} value={g.grupoId}>
                    {g.grado.numero}° {g.nombre} {g.nivel.nombre.toUpperCase()} ({g.ciclo.nombre})
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Selector de Materia */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.5px' }}>
            2. SELECCIONAR MATERIA
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={materiaSelecionadaId ?? ''}
              onChange={(e) => setMateriaSeleccionadaId(Number(e.target.value) || null)}
              disabled={!grupoSeleccionadoId}
              style={{
                width: '100%',
                border: '1.5px solid #0f172a', // Darker border for emphasis as in screenshot
                borderRadius: 8,
                padding: '10px 36px 10px 12px',
                fontSize: 14,
                fontWeight: 500,
                background: '#fff',
                color: '#0f172a',
                outline: 'none',
                appearance: 'none',
                cursor: !grupoSeleccionadoId ? 'not-allowed' : 'pointer',
                opacity: !grupoSeleccionadoId ? 0.5 : 1,
              }}
            >
              <option value="">{grupoSeleccionadoId ? 'Selecciona una materia...' : 'Primero selecciona un grupo'}</option>
              {grupoActual?.materias?.map((m) => (
                <option key={m.grupoMateriaId} value={m.grupoMateriaId}>
                  {m.materia.nombre}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>



      {/* Tabla de Captura */}
      {materiaSelecionadaId && (
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          paddingBottom: '20px'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
              Captura de Evaluaciones
            </h3>
            <span style={{ 
              fontSize: 12, 
              color: '#64748b', 
              background: '#f1f5f9', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontWeight: 600 
            }}>
              {alumnosDelGrupo.length} Alumnos
            </span>
          </div>

          {loadingAlumnos ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Loader2 size={24} style={{ margin: '0 auto 8px', display: 'block', animation: 'spin 1s linear infinite' }} />
              Cargando alumnos...
            </div>
          ) : alumnosDelGrupo.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No hay alumnos inscritos en este grupo.</p>
              <p style={{ fontSize: 12 }}>Inscribe alumnos al grupo desde el módulo de Alumnos.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#94a3b8', width: 40 }}>#</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#1e293b' }}>Alumno</th>
                    {PERIODOS.map((p) => (
                      <th key={p.id} style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {p.label}
                      </th>
                    ))}
                    <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#1e293b' }}>
                      Prom.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosDelGrupo.map((al, idx) => {
                    const alumnoCalifs = califMap[al.alumnoId] ?? {};
                    const prom = calcularPromedio(alumnoCalifs);
                    const promNum = parseFloat(prom);
                    const promLow = !isNaN(promNum) && promNum < 6;

                    return (
                      <tr
                        key={al.alumnoId}
                        style={{
                          borderBottom: '1px solid #f8fafc',
                          background: 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 24px', color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '12px 24px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{al.nombreCompleto}</div>
                          {al.matricula && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>MAT: {al.matricula}</div>
                          )}
                        </td>
                        {PERIODOS.map((p) => (
                          <td key={p.id} style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <CalifCelda
                                key={`${al.alumnoId}-${materiaSelecionadaId}-${p.id}`}
                                alumnoId={al.alumnoId}
                                grupoMateriaId={materiaSelecionadaId}
                                periodoId={p.id}
                                initialValue={alumnoCalifs[p.id] ?? ''}
                                onSaved={handleSaved}
                              />
                            </div>
                          </td>
                        ))}
                        <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                            background: prom === '—' ? '#f1f5f9' : (promLow ? '#fef2f2' : '#f0fdf4'),
                            color: prom === '—' ? '#94a3b8' : (promLow ? '#dc2626' : '#16a34a'),
                            border: 'none',
                            minWidth: 50
                          }}>
                            {prom}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Boton Guardar Toda la Sábana */}
      {materiaSelecionadaId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={() => toast.success('Las calificaciones se guardan automáticamente.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <Save size={18} /> Guardar Toda la Sábana
          </button>
        </div>
      )}

      {/* Estado vacío inicial (Mini Dashboard) */}
      {!materiaSelecionadaId && !grupoSeleccionadoId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
          {/* Tarjetas de Estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{alumnos?.length || 0}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Alumnos a Evaluar</div>
              </div>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={24} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{grupos?.length || 0}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Grupos Activos</div>
              </div>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
                  {(grupos as Grupo[] | undefined)?.reduce((acc, g) => acc + (g.materias?.length || 0), 0) || 0}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Materias Configuradas</div>
              </div>
            </div>
          </div>

          {/* Guía Paso a Paso */}
          <div style={{ background: '#f8fafc', padding: 40, borderRadius: 16, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 32px 0' }}>¿Cómo registrar calificaciones?</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 140 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <MousePointerClick size={24} />
                </div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>1. Selecciona Grupo</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>En la barra superior</div>
              </div>
              
              <div style={{ width: 40, height: 2, background: '#cbd5e1', alignSelf: 'flex-start', marginTop: 28 }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 140 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <BookOpen size={24} />
                </div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>2. Elige Materia</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Asignada al grupo</div>
              </div>

              <div style={{ width: 40, height: 2, background: '#cbd5e1', alignSelf: 'flex-start', marginTop: 28 }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 140 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0f172a', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>3. Captura</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Guarda automáticamente</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
