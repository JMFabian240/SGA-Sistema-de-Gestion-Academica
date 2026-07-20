/**
 * Script to read the INSCRITOS CONTROL 25-26 Excel file,
 * extract student data, generate random tutors, and produce
 * 4 CSV files matching the import templates.
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// ──────────────────────────────────────────────────
// 1. Parse the Excel file (reuse excelHelper logic)
// ──────────────────────────────────────────────────

const filePath = path.resolve(
  __dirname,
  '../../docs/resources/data/INSCRITOS CONTROL 25-26 A CORTE.xlsx',
);
const outputDir = path.resolve(__dirname, '../../docs/resources');

interface AlumnoParsed {
  nombre: string;
  sheetName: string;
  pagoMeses: number;
  moroso: boolean;
  matricula: string;
}

function parseSheetName(sheetName: string) {
  const numMatch = sheetName.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 1;
  let code = 'PRI';
  if (sheetName.includes('K')) code = 'PRE';
  if (sheetName.includes('S')) code = 'SEC';
  if (sheetName.includes('B')) code = 'BAC';
  return { gradoNum: num, nivelCode: code };
}

function getDobFromGrade(gradoNumero: number, nivelCodigo: string): Date {
  const currentYear = new Date().getFullYear();
  let age = 6;
  if (nivelCodigo === 'PRE') age = 3 + (gradoNumero - 1);
  if (nivelCodigo === 'PRI') age = 6 + (gradoNumero - 1);
  if (nivelCodigo === 'SEC') age = 12 + (gradoNumero - 1);
  if (nivelCodigo === 'BAC') age = 15 + Math.floor((gradoNumero - 1) / 2);
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month, day);
}

// Map nivel code to human-readable name for the CSV
function nivelNombre(code: string) {
  if (code === 'PRE') return 'Preescolar';
  if (code === 'PRI') return 'Primaria';
  if (code === 'SEC') return 'Secundaria';
  if (code === 'BAC') return 'Bachillerato';
  return 'Primaria';
}

// Map nivel code + gradoNum to the grado name used in the catalog
function gradoNombre(gradoNum: number, nivelCode: string) {
  if (nivelCode === 'BAC') {
    const semNum = gradoNum * 2 - 1; // 1->1, 2->3, 3->5
    return `${semNum}° Semestre`;
  }
  return `${gradoNum}° Grado`;
}

function getLetraGrupo(nivelCode: string) {
  if (nivelCode === 'PRE') return 'K';
  if (nivelCode === 'PRI') return 'P';
  if (nivelCode === 'SEC') return 'S';
  if (nivelCode === 'BAC') return 'B';
  return 'A';
}

function tipoCiclo(nivelCode: string) {
  return nivelCode === 'BAC' ? 'SEMESTRAL' : 'ANUAL';
}

// ──────────────────────────────────────────────────
// 2. Read Excel
// ──────────────────────────────────────────────────

const workbook = XLSX.readFile(filePath);

// Extract morosos from ADEUDOS sheet
const morososNombres = new Set<string>();
const adeudosSheet = workbook.Sheets['ADEUDOS'];
if (adeudosSheet) {
  const dataAdeudos = XLSX.utils.sheet_to_json<any>(adeudosSheet, { header: 1 });
  for (const row of dataAdeudos) {
    if (!row || row.length === 0) continue;
    const nombre = row[0];
    if (nombre && typeof nombre === 'string' && nombre.length > 5) {
      const upper = nombre.toUpperCase();
      if (
        !upper.includes('PRIMARIA') &&
        !upper.includes('PRESCOLAR') &&
        !upper.includes('SECUNDARIA') &&
        !upper.includes('BACHILLERATO') &&
        !upper.includes('ADEUDO')
      ) {
        morososNombres.add(nombre.trim().toUpperCase());
      }
    }
  }
}

const alumnosList: AlumnoParsed[] = [];
const nombresUnicos = new Set<string>();
const sheetNamesUsed: string[] = [];

for (const sheetName of workbook.SheetNames) {
  if (['MATRICULA', 'CONTROL FACTURACION', 'ADEUDOS'].includes(sheetName)) continue;
  sheetNamesUsed.push(sheetName);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    const rawMatricula = row[2];
    const alumnoNombre = row[3];
    const planPagoTexto = String(row[20] || '');
    if (
      alumnoNombre &&
      typeof alumnoNombre === 'string' &&
      alumnoNombre.trim() !== '' &&
      alumnoNombre.trim() !== 'NOMBRE DEL ALUMNO'
    ) {
      const nombreClean = alumnoNombre.trim();
      const nombreUpper = nombreClean.toUpperCase();
      if (
        nombreUpper.includes('IRRIGULARIDADES') ||
        nombreUpper.includes('TOTAL') ||
        nombreClean.length < 5
      )
        continue;
      if (!nombresUnicos.has(nombreUpper)) {
        nombresUnicos.add(nombreUpper);
        alumnosList.push({
          nombre: nombreClean,
          sheetName,
          pagoMeses: planPagoTexto.includes('12') ? 12 : 10,
          moroso: morososNombres.has(nombreUpper),
          matricula:
            rawMatricula && rawMatricula !== 'NUEVO INGRESO'
              ? String(rawMatricula).trim()
              : '',
        });
      }
    }
  }
}

console.log(`Total alumnos extraidos: ${alumnosList.length}`);
console.log(`Hojas usadas: ${sheetNamesUsed.join(', ')}`);

// ──────────────────────────────────────────────────
// 3. Generate random tutors
// ──────────────────────────────────────────────────

const nombresM = [
  'Alejandro', 'Jose', 'Juan', 'Francisco', 'Pedro', 'Antonio', 'Luis', 'Carlos',
  'Miguel', 'Sergio', 'Roberto', 'Ricardo', 'Eduardo', 'Fernando', 'Oscar',
  'Arturo', 'Rafael', 'Javier', 'Enrique', 'Humberto',
];
const nombresF = [
  'Maria', 'Carmen', 'Guadalupe', 'Margarita', 'Rosa', 'Alicia', 'Ana', 'Laura',
  'Patricia', 'Leticia', 'Martha', 'Veronica', 'Gabriela', 'Teresa', 'Adriana',
  'Monica', 'Silvia', 'Beatriz', 'Claudia', 'Lucía',
];
const apellidos = [
  'Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Hernandez', 'Gonzalez',
  'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Gomez', 'Diaz',
  'Reyes', 'Morales', 'Jimenez', 'Ruiz', 'Alvarez', 'Castillo', 'Vargas',
  'Cruz', 'Ortiz', 'Mendoza', 'Gutierrez', 'Romero',
];
const parentescos = ['PADRE', 'MADRE', 'TUTOR'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTutorName(): string {
  const isFemale = Math.random() > 0.5;
  const nombre = isFemale ? randomPick(nombresF) : randomPick(nombresM);
  return `${nombre} ${randomPick(apellidos)} ${randomPick(apellidos)}`;
}

function generatePhone(): string {
  return `921${Math.floor(1000000 + Math.random() * 9000000)}`;
}

function generateEmail(name: string, idx: number): string {
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .substring(0, 20);
  return `${clean}${idx}@ejemplo.com`;
}

// Assign tutors: each tutor has 1-4 students
interface TutorInfo {
  nombre: string;
  parentesco: string;
  telefono: string;
  correo: string;
  alumnoIndices: number[];
}

const tutores: TutorInfo[] = [];
const shuffled = alumnosList.map((_, i) => i).sort(() => Math.random() - 0.5);

let cursor = 0;
let tutorIdx = 1;
while (cursor < shuffled.length) {
  const remaining = shuffled.length - cursor;
  // Make sure we don't leave a future tutor with 0 students
  let groupSize: number;
  if (remaining <= 4) {
    groupSize = remaining;
  } else if (remaining <= 5) {
    // Avoid leaving 1 alone that could be 0 by splitting 3+2 or 2+3
    groupSize = Math.random() > 0.5 ? 3 : 2;
  } else {
    groupSize = Math.floor(Math.random() * 4) + 1; // 1-4
  }

  const nombre = generateTutorName();
  const tutor: TutorInfo = {
    nombre,
    parentesco: randomPick(parentescos),
    telefono: generatePhone(),
    correo: generateEmail(nombre, tutorIdx),
    alumnoIndices: shuffled.slice(cursor, cursor + groupSize),
  };
  tutores.push(tutor);
  cursor += groupSize;
  tutorIdx++;
}

// Build a map: alumnoIndex -> tutor
const alumnoToTutor = new Map<number, TutorInfo>();
for (const t of tutores) {
  for (const ai of t.alumnoIndices) {
    alumnoToTutor.set(ai, t);
  }
}

console.log(`Tutores generados: ${tutores.length}`);

// ──────────────────────────────────────────────────
// 4. Generate CSV 1: Catálogo Académico
// ──────────────────────────────────────────────────

// Gather unique groups from the data
const gruposSet = new Set<string>();
const gruposList: { tipoCicloStr: string; nivel: string; grado: string; grupo: string }[] = [];

for (const a of alumnosList) {
  const { gradoNum, nivelCode } = parseSheetName(a.sheetName);
  const key = `${nivelCode}-${gradoNum}`;
  if (!gruposSet.has(key)) {
    gruposSet.add(key);
    gruposList.push({
      tipoCicloStr: tipoCiclo(nivelCode),
      nivel: nivelNombre(nivelCode),
      grado: gradoNombre(gradoNum, nivelCode),
      grupo: getLetraGrupo(nivelCode),
    });
  }
}

let catalogoCsv = 'Tipo de Ciclo,Nivel Educativo,Grado,Nombre Grupo,Cupo Maximo\n';
for (const g of gruposList) {
  catalogoCsv += `${g.tipoCicloStr},${g.nivel},${g.grado},${g.grupo},40\n`;
}
fs.writeFileSync(path.join(outputDir, 'Plantilla_Catalogo_Academico_Llenada.csv'), '\uFEFF' + catalogoCsv, 'utf8');
console.log(`Catalogo: ${gruposList.length} filas`);

// ──────────────────────────────────────────────────
// 5. Generate CSV 2: Inscripciones
// ──────────────────────────────────────────────────

function generateCurp(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let curp = '';
  for (let i = 0; i < 18; i++) curp += chars[Math.floor(Math.random() * chars.length)];
  return curp;
}

let inscripcionesCsv =
  'Tipo de Ciclo,Matricula,CURP Alumno,Nombre Alumno,Fecha Nacimiento,Sexo,Estado Alumno,Nombre Tutor,Parentesco,Telefono Tutor,Correo Tutor,Nivel Educativo Destino,Grado Destino,Grupo Destino,Plan de Pago Asignado\n';

for (let i = 0; i < alumnosList.length; i++) {
  const a = alumnosList[i];
  const { gradoNum, nivelCode } = parseSheetName(a.sheetName);
  const tutor = alumnoToTutor.get(i)!;
  const dob = getDobFromGrade(gradoNum, nivelCode);
  const dobStr = dob.toISOString().split('T')[0];
  const sexo = Math.random() > 0.5 ? 'M' : 'F';
  const matriculaVal = a.matricula || `MAT-${String(i + 1).padStart(4, '0')}`;
  const curp = generateCurp();
  const planPago = a.pagoMeses === 12 ? 'Plan 12 Meses' : 'Plan 10 Meses';

  inscripcionesCsv += `${tipoCiclo(nivelCode)},${matriculaVal},${curp},${a.nombre},${dobStr},${sexo},ACTIVO,${tutor.nombre},${tutor.parentesco},${tutor.telefono},${tutor.correo},${nivelNombre(nivelCode)},${gradoNombre(gradoNum, nivelCode)},${getLetraGrupo(nivelCode)},${planPago}\n`;
}

fs.writeFileSync(
  path.join(outputDir, 'Plantilla_Inscripcion_Alumnos_Llenada.csv'),
  '\uFEFF' + inscripcionesCsv,
  'utf8',
);
console.log(`Inscripciones: ${alumnosList.length} filas`);

// ──────────────────────────────────────────────────
// 6. Generate CSV 3 & 4: Pagos Anteriores y Saldos Iniciales
// ──────────────────────────────────────────────────

// Months for the active cycle
const mesesAnuales = [
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
];
// For semestral (5 months)
const mesesSemestrales = [
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero',
];

// Montos de colegiatura por nivel
function montoColegiatura(nivelCode: string): number {
  if (nivelCode === 'BAC') return 2200;
  return 2500;
}

// Fechas de vencimiento (day 10 of each month)
function fechaVencimiento(mes: string): string {
  const mesMap: Record<string, string> = {
    Septiembre: '2025-09-10',
    Octubre: '2025-10-10',
    Noviembre: '2025-11-10',
    Diciembre: '2025-12-10',
    Enero: '2026-01-10',
    Febrero: '2026-02-10',
    Marzo: '2026-03-10',
    Abril: '2026-04-10',
    Mayo: '2026-05-10',
    Junio: '2026-06-10',
  };
  return mesMap[mes] || '2025-09-10';
}

let pagosCsv =
  'Tipo de Ciclo,Matricula,CURP Alumno,Nombre Alumno,Fecha Pago,Monto Total,Metodo Pago,Observaciones\n';

let saldosCsv =
  'Tipo de Ciclo,Matricula,CURP Alumno,Nombre Alumno,Concepto,Mes,Fecha Vencimiento,Monto Original,Monto Pagado,Estado Cobro\n';

const metodosPago = ['DEPOSITO', 'TRANSFERENCIA', 'TARJETA_DEBITO'];

// Split students: first half fully paid, second half 1/3 paid
const halfPoint = Math.floor(alumnosList.length / 2);

for (let i = 0; i < alumnosList.length; i++) {
  const a = alumnosList[i];
  const { gradoNum, nivelCode } = parseSheetName(a.sheetName);
  const cicloStr = tipoCiclo(nivelCode);
  const monto = montoColegiatura(nivelCode);
  const matriculaVal = a.matricula || `MAT-${String(i + 1).padStart(4, '0')}`;
  const meses = nivelCode === 'BAC' ? mesesSemestrales : mesesAnuales;
  const fullyPaid = i < halfPoint;

  if (fullyPaid) {
    // All months paid
    for (const mes of meses) {
      // Pago row
      const fechaPago = fechaVencimiento(mes).replace('-10', '-08'); // Paid 2 days before
      pagosCsv += `${cicloStr},${matriculaVal},,${a.nombre},${fechaPago},${monto},${randomPick(metodosPago)},Pago puntual\n`;

      // Saldo row (PAGADO)
      saldosCsv += `${cicloStr},${matriculaVal},,${a.nombre},Colegiatura,${mes},${fechaVencimiento(mes)},${monto},${monto},PAGADO\n`;
    }
  } else {
    // 1/3 paid, rest PENDIENTE
    const paidCount = Math.max(1, Math.floor(meses.length / 3));
    for (let m = 0; m < meses.length; m++) {
      const mes = meses[m];
      if (m < paidCount) {
        // Paid
        const fechaPago = fechaVencimiento(mes).replace('-10', '-09');
        pagosCsv += `${cicloStr},${matriculaVal},,${a.nombre},${fechaPago},${monto},${randomPick(metodosPago)},\n`;
        saldosCsv += `${cicloStr},${matriculaVal},,${a.nombre},Colegiatura,${mes},${fechaVencimiento(mes)},${monto},${monto},PAGADO\n`;
      } else {
        // Pending
        saldosCsv += `${cicloStr},${matriculaVal},,${a.nombre},Colegiatura,${mes},${fechaVencimiento(mes)},${monto},0,PENDIENTE\n`;
      }
    }
  }
}

fs.writeFileSync(
  path.join(outputDir, 'Plantilla_Pagos_Anteriores_Llenada.csv'),
  '\uFEFF' + pagosCsv,
  'utf8',
);
fs.writeFileSync(
  path.join(outputDir, 'Plantilla_Saldos_Iniciales_Llenada.csv'),
  '\uFEFF' + saldosCsv,
  'utf8',
);

console.log('✅ Todos los CSVs generados en docs/resources');
console.log(`   - Catalogo: ${gruposList.length} grupos`);
console.log(`   - Inscripciones: ${alumnosList.length} alumnos`);
console.log(`   - Tutores: ${tutores.length} (max 4 alumnos c/u)`);
console.log(`   - Pagos: primera mitad (${halfPoint}) todo pagado, segunda mitad con 1/3 pagado`);
