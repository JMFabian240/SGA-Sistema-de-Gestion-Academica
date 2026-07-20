import { useState } from 'react';
import { FileText, Download, Search, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { trpc } from '../../../lib/trpc';
import { parseSpanishName } from '../../../utils/nameParser';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalificacionFila {
  nombre: string;
  T1: string;
  T2: string;
  T3: string;
  prom: string;
}

interface AlumnoResumen {
  alumnoId: number;
  nombreCompleto: string;
  matricula: string | null;
  curp: string | null;
  nivel: { nombre: string } | null;
  grado: { numero: number; nombre: string } | null;
  inscripciones: Array<{
    ciclo: { cicloId: number; nombre: string; activo: boolean | null };
    grupo: { nombre: string } | null;
  }>;
}

// ─── PDF Generator ───────────────────────────────────────────────────────────

async function exportarBoletaPDF(
  alumno: AlumnoResumen,
  calificaciones: CalificacionFila[],
  promedioGeneral: string,
  cicloNombre: string,
  docenteTitular: string
) {
  const nivel = (alumno.nivel?.nombre || 'PRIMARIA').toUpperCase();
  const nombre = alumno.nombreCompleto || 'N/A';
  const curp = alumno.curp || '';
  const matricula = alumno.matricula || '';
  const grado = String(alumno.grado?.numero || '');
  const inscripcionActiva = alumno.inscripciones?.[0];
  const grupoNombre = inscripcionActiva?.grupo?.nombre || '';
  const turno = 'MATUTINO';
  const ctt = nivel.includes('PREESCOLAR')
    ? '30PJN1037Z'
    : nivel.includes('PRIMARIA')
    ? '30PPR3773B'
    : nivel.includes('SECUNDARIA')
    ? '30PES0033G'
    : '30PBH0195P';
  const docente = docenteTitular || 'DOCENTE SIN ASIGNAR';

  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = String(hoy.getFullYear()).slice(-2);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW = 215.9, M = 15;
  let y = M;

  try {
    const img = new Image();
    img.src = '/logo.png';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    doc.addImage(img, 'PNG', 20, 15, 25, 32);
  } catch {
    // escudo no disponible
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setFont = (style: string) => doc.setFont(undefined as any, style);

  setFont('bold');
  doc.setFontSize(10);
  doc.text('CENTRO DE INVESTIGACIÓN EDUCATIVA COLEGIO SAN DIEGO', PW / 2, y + 5, { align: 'center' });
  setFont('normal');
  doc.setFontSize(9);
  doc.text('Punta el Campanario #183 Col. Bahía de San Martín', PW / 2, y + 11, { align: 'center' });
  doc.text(`Nivel ${nivel.charAt(0) + nivel.slice(1).toLowerCase()}`, PW / 2, y + 17, { align: 'center' });
  doc.text(ctt, PW / 2, y + 23, { align: 'center' });

  y += 35;
  setFont('bold');
  doc.setFontSize(11);
  doc.text(`BOLETA INTERNA DE CALIFICACIONES — ${cicloNombre}`, PW / 2, y, { align: 'center' });
  y += 8;

  const boxHeight = 22;
  doc.setLineWidth(0.5);
  doc.rect(M, y, PW - 2 * M, boxHeight);

  setFont('normal');
  doc.setFontSize(8);
  doc.text('Nombre del (de la) alumno (a):', M + 2, y + 6);

  const { nombres, ape1, ape2 } = parseSpanishName(nombre);

  setFont('bold');
  doc.setFontSize(7);
  doc.text(ape1.substring(0, 25), M + 62.5, y + 5.5, { align: 'center' });
  doc.text(ape2.substring(0, 25), M + 99.5, y + 5.5, { align: 'center' });
  doc.text(nombres.substring(0, 25), M + 136.5, y + 5.5, { align: 'center' });
  doc.setLineWidth(0.2);
  doc.line(M + 45, y + 7, M + 80, y + 7);
  doc.line(M + 82, y + 7, M + 117, y + 7);
  doc.line(M + 119, y + 7, M + 154, y + 7);
  setFont('normal');
  doc.setFontSize(6);
  doc.text('PRIMER APELLIDO', M + 62.5, y + 10, { align: 'center' });
  doc.text('SEGUNDO APELLIDO', M + 99.5, y + 10, { align: 'center' });
  doc.text('NOMBRE(S)', M + 136.5, y + 10, { align: 'center' });

  setFont('normal');
  doc.setFontSize(8);
  doc.text('Grado y Grupo:', M + 152, y + 6);
  setFont('bold');
  doc.setFontSize(7);
  const letraGrupo = grupoNombre.match(/[A-Z]/)?.[0] || '';
  doc.text(`${grado} ${letraGrupo}`.trim(), M + 177.9, y + 5.5, { align: 'center' });
  doc.line(M + 170, y + 7, PW - M, y + 7);

  setFont('normal');
  doc.setFontSize(8);
  doc.text('CURP', M + 5, y + 18);
  setFont('bold');
  doc.setFontSize(7);
  doc.text(curp, M + 35, y + 17.5, { align: 'center' });
  doc.line(M + 15, y + 19, M + 55, y + 19);

  setFont('normal');
  doc.setFontSize(8);
  doc.text('Turno:', M + 58, y + 18);
  setFont('bold');
  doc.setFontSize(7);
  doc.text(turno, M + 85, y + 17.5, { align: 'center' });
  doc.line(M + 70, y + 19, M + 100, y + 19);

  setFont('normal');
  doc.setFontSize(8);
  doc.text('CTT', M + 105, y + 18);
  setFont('bold');
  doc.setFontSize(7);
  doc.text(ctt, M + 145, y + 17.5, { align: 'center' });
  doc.line(M + 115, y + 19, PW - M - 20, y + 19);

  y += boxHeight + 8;

  const col1 = 45, colTrim = 28, colProm = 20, sideW = 35;

  const drawCell = (x: number, cy: number, w: number, h: number, text: string, isBlue = false, isBold = false) => {
    if (isBlue) { doc.setFillColor(143, 172, 220); doc.rect(x, cy, w, h, 'F'); }
    doc.setLineWidth(0.5);
    doc.rect(x, cy, w, h);
    doc.setFontSize(8);
    setFont(isBold ? 'bold' : 'normal');
    doc.setTextColor(0, 0, 0);
    const t = text.length > 25 ? text.substring(0, 25) : text;
    doc.text(t, x + w / 2, cy + h / 2 + 1, { align: 'center', baseline: 'middle' });
  };

  const drawDoubleCell = (x: number, cy: number, w: number, h: number, t1: string, t2: string, isBlue = false) => {
    doc.setLineWidth(0.5);
    if (isBlue) doc.setFillColor(143, 172, 220);
    doc.rect(x, cy, w, h, isBlue ? 'FD' : 'S');
    doc.setFontSize(7);
    setFont('bold');
    doc.setTextColor(0, 0, 0);
    doc.text(t1, x + w / 2, cy + h / 4 + 1, { align: 'center', baseline: 'middle' });
    doc.text(t2, x + w / 2, cy + h * 0.75 + 1, { align: 'center', baseline: 'middle' });
    doc.line(x, cy + h / 2, x + w, cy + h / 2);
  };

  const tableStartY = y;
  const headerH = 12;
  drawCell(M, y, col1, headerH, 'ASIGNATURAS', true, true);
  drawDoubleCell(M + col1, y, colTrim, headerH, '1er. Trimestre', 'Calificación', true);
  drawDoubleCell(M + col1 + colTrim, y, colTrim, headerH, '2do. Trimestre', 'Calificación', true);
  drawDoubleCell(M + col1 + colTrim * 2, y, colTrim, headerH, '3er. Trimestre', 'Calificación', true);
  drawDoubleCell(M + col1 + colTrim * 3, y, colProm, headerH, 'Promedio', 'Final', true);

  const tableW = col1 + colTrim * 3 + colProm;
  const sideX = M + tableW + 5;
  drawDoubleCell(sideX, y, sideW, 8, 'FIRMA DEL PADRE DE', 'FAMILIA O TUTOR', true);
  doc.rect(sideX, y + 8, sideW, 18); setFont('bold'); doc.setFontSize(7); doc.text('1er. Periodo', sideX + 2, y + 12);
  doc.rect(sideX, y + 26, sideW, 18); doc.text('2do. Periodo', sideX + 2, y + 30);
  doc.rect(sideX, y + 44, sideW, 18); doc.text('3er. Periodo', sideX + 2, y + 48);

  y += headerH;
  const rowH = 9;
  calificaciones.forEach((mat) => {
    drawCell(M, y, col1, rowH, mat.nombre.toUpperCase());
    drawCell(M + col1, y, colTrim, rowH, mat.T1 || '');
    drawCell(M + col1 + colTrim, y, colTrim, rowH, mat.T2 || '');
    drawCell(M + col1 + colTrim * 2, y, colTrim, rowH, mat.T3 || '');
    drawCell(M + col1 + colTrim * 3, y, colProm, rowH, mat.prom || '', false, true);
    y += rowH;
  });

  const finalBoxY = Math.max(y, tableStartY + 62 + 5);
  drawDoubleCell(sideX, finalBoxY, sideW, 8, 'PROMEDIO FINAL', 'DE GRADO', true);
  doc.rect(sideX, finalBoxY + 8, sideW, 10);
  doc.setFontSize(10);
  setFont('bold');
  doc.text(promedioGeneral, sideX + sideW / 2, finalBoxY + 14, { align: 'center', baseline: 'middle' });

  y = Math.max(y, finalBoxY + 18) + 15;
  const boxW = 100;
  doc.rect(M + 15, y, boxW, 35);
  doc.setFontSize(8);
  setFont('bold');
  doc.text(docente, M + 15 + boxW / 2, y + 20, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(M + 25, y + 22, M + 15 + boxW - 10, y + 22);
  doc.setFontSize(7);
  doc.text('NOMBRE Y FIRMA DEL DOCENTE', M + 15 + boxW / 2, y + 25, { align: 'center' });
  setFont('normal');
  doc.setFontSize(8);
  doc.text('COATZACOALCOS, VERACRUZ', M + 15 + boxW / 2, y + 30, { align: 'center' });
  doc.setFontSize(7);
  doc.text('LUGAR DE EXPEDICIÓN', M + 15 + boxW / 2, y + 33, { align: 'center' });

  const dateX = PW - M - 40;
  setFont('bold');
  doc.setFontSize(8);
  doc.text('DÍA     MES     AÑO', dateX + 17, y + 20, { align: 'center' });
  doc.rect(dateX, y + 22, 10, 6); doc.text(dia, dateX + 5, y + 26, { align: 'center' });
  doc.rect(dateX + 12, y + 22, 10, 6); doc.text(mes, dateX + 17, y + 26, { align: 'center' });
  doc.rect(dateX + 24, y + 22, 10, 6); doc.text(anio, dateX + 29, y + 26, { align: 'center' });
  doc.setLineWidth(1.5);
  doc.line(dateX, y + 28, dateX + 34, y + 28);
  doc.setFontSize(7);
  doc.text('FECHA DE EXPEDICIÓN', dateX + 17, y + 32, { align: 'center' });

  doc.save(`Boleta_${nivel}_${matricula || alumno.alumnoId}.pdf`);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BoletasPage() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<AlumnoResumen | null>(null);
  const [cicloSeleccionadoId, setCicloSeleccionadoId] = useState<number | null>(null);
  const [generando, setGenerando] = useState(false);

  const { data: alumnos, isLoading: loadingAlumnos } = trpc.alumnos.getAll.useQuery();

  const { data: boletaData, isLoading: loadingBoleta } = trpc.calificaciones.generarBoletaCiclo.useQuery(
    { alumnoId: alumnoSeleccionado?.alumnoId ?? 0, cicloId: cicloSeleccionadoId ?? 0 },
    { enabled: !!alumnoSeleccionado && !!cicloSeleccionadoId }
  );

  const nivelesDisponibles = ['PREESCOLAR', 'PRIMARIA', 'SECUNDARIA', 'BACHILLERATO'];

  // Agrupar calificaciones por materia → T1, T2, T3 según periodoId
  const calificacionesFilas: CalificacionFila[] = (() => {
    if (!boletaData?.materias?.length) return [];
    const map: Record<string, CalificacionFila> = {};
    boletaData.materias.forEach((item) => {
      const nombre = item.materia;
      if (!map[nombre]) map[nombre] = { nombre, T1: '', T2: '', T3: '', prom: '' };
      const val = String(item.calificacion ?? '');
      const pid = item.periodoId ?? 1;
      if (pid === 1) map[nombre].T1 = val;
      else if (pid === 2) map[nombre].T2 = val;
      else map[nombre].T3 = val;
    });
    return Object.values(map).map((f) => {
      const vals = [f.T1, f.T2, f.T3].map(Number).filter((n) => !isNaN(n) && n > 0);
      f.prom = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-';
      return f;
    });
  })();

  const promedioGeneral = (() => {
    const nums = calificacionesFilas.map((c) => parseFloat(c.prom)).filter((n) => !isNaN(n));
    return nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '-';
  })();

  const resultados = ((alumnos ?? []) as unknown as AlumnoResumen[]).filter((al) => {
    const q = busqueda.trim().toLowerCase();
    const matchQ = !q || al.nombreCompleto.toLowerCase().includes(q) || (al.matricula?.toLowerCase().includes(q) ?? false);
    const matchN = !filtroNivel || (al.nivel?.nombre?.toUpperCase() === filtroNivel);
    return matchQ && matchN;
  });

  const seleccionar = (al: AlumnoResumen) => {
    setAlumnoSeleccionado(al);
    const inscripcionActiva = al.inscripciones?.find((i) => i.ciclo?.activo);
    setCicloSeleccionadoId(inscripcionActiva?.ciclo?.cicloId ?? null);
  };

  const volver = () => { setAlumnoSeleccionado(null); setCicloSeleccionadoId(null); };

  const generarPDF = async () => {
    if (!alumnoSeleccionado) return;
    setGenerando(true);
    try {
      const cicloNombre = alumnoSeleccionado.inscripciones
        ?.find((i) => i.ciclo?.cicloId === cicloSeleccionadoId)?.ciclo?.nombre ?? '';
      await exportarBoletaPDF(alumnoSeleccionado, calificacionesFilas, promedioGeneral, cicloNombre, boletaData?.docenteTitular || '');
    } catch (err) {
      console.error(err);
    } finally {
      setGenerando(false);
    }
  };

  // ── Vista Lista ──────────────────────────────────────────────────────────
  if (!alumnoSeleccionado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Generación de Boletas
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Selecciona un alumno para previsualizar y descargar su boleta de calificaciones en PDF.
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: 16 }}>
          <div style={{ gridColumn: '1 / 3' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              Buscar alumno
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', width: 16, height: 16 }} />
              <input
                type="text"
                style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 8, paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 14, background: 'var(--color-bg-card)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Nombre o matrícula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              Nivel
            </label>
            <select
              style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: 'var(--color-bg-card)', color: 'var(--color-text)', outline: 'none' }}
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
            >
              <option value="">Todos los niveles</option>
              {nivelesDisponibles.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loadingAlumnos ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando alumnos...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Alumno', 'Nivel', 'Grado / Grupo', 'Ciclo Activo', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: i === 4 ? 'right' : 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultados.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No se encontraron alumnos.
                    </td>
                  </tr>
                ) : (
                  resultados.map((al) => {
                    const inscripcionActiva = al.inscripciones?.find((i) => i.ciclo?.activo);
                    return (
                      <tr key={al.alumnoId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{al.nombreCompleto}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Mat: {al.matricula || 'S/M'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>{al.nivel?.nombre || 'N/A'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>
                          {al.grado?.numero ? `${al.grado.numero}° ` : ''}{inscripcionActiva?.grupo?.nombre || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>
                          {inscripcionActiva?.ciclo?.nombre || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => seleccionar(al)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13, fontWeight: 500, border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
                          >
                            <FileText size={14} />
                            Ver Boleta
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── Vista Previsualización ───────────────────────────────────────────────
  const cicloActual = alumnoSeleccionado.inscripciones?.find((i) => i.ciclo?.cicloId === cicloSeleccionadoId);
  const pdfDisabled = generando || loadingBoleta || calificacionesFilas.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={volver}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg-card)', color: 'var(--color-text)', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} />
          Volver a la lista
        </button>
        <button
          onClick={generarPDF}
          disabled={pdfDisabled}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, background: pdfDisabled ? '#94a3b8' : '#0f172a', color: '#fff', borderRadius: 8, border: 'none', cursor: pdfDisabled ? 'not-allowed' : 'pointer', opacity: generando ? 0.7 : 1, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          <Download size={16} />
          {generando ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      {/* Info Alumno */}
      <div style={{ background: '#1e293b', color: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: 14 }}>
          {[
            { label: 'Alumno', value: alumnoSeleccionado.nombreCompleto, big: false },
            { label: 'Matrícula', value: alumnoSeleccionado.matricula || 'S/M', big: false },
            { label: 'Ciclo', value: cicloActual?.ciclo?.nombre || '—', big: false },
            { label: 'Promedio General', value: promedioGeneral, big: true },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontWeight: item.big ? 800 : 600, fontSize: item.big ? 28 : 14 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla Calificaciones */}
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-hover)' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Calificaciones — {cicloActual?.ciclo?.nombre || 'Ciclo Actual'}
          </h3>
        </div>
        {!cicloSeleccionadoId ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>El alumno no tiene un ciclo escolar activo.</p>
            <p style={{ fontSize: 12 }}>No es posible generar una boleta para un alumno sin inscripción vigente.</p>
          </div>
        ) : loadingBoleta ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando calificaciones...</div>
        ) : calificacionesFilas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No hay calificaciones registradas para este alumno.</p>
            <p style={{ fontSize: 12 }}>Asegúrate de que el docente haya capturado las calificaciones del ciclo activo.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border)' }}>
                {['Asignatura', '1er Trimestre', '2do Trimestre', '3er Trimestre', 'Promedio'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 600, color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calificacionesFilas.map((c, i) => {
                const low = c.prom && c.prom !== '-' && parseFloat(c.prom) < 6;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--color-text)' }}>{c.nombre}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--color-text)' }}>{c.T1 || '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--color-text)' }}>{c.T2 || '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--color-text)' }}>{c.T3 || '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: low ? '#dc2626' : '#059669' }}>
                      {c.prom || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
        La boleta se descarga automáticamente en formato PDF al hacer clic en "Descargar PDF".
      </p>
    </div>
  );
}
