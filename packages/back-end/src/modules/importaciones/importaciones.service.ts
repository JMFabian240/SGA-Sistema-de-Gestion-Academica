import { prisma } from '@sga/data-access';
import * as Papa from 'papaparse';
import { CatalogoAcademicoSchema, CatalogoAcademicoImportRow } from './importaciones.schema';

export class ImportacionesService {
  async procesarImportacionCatalogo(csvBuffer: Buffer, cicloId: number): Promise<{ success: boolean; message: string }> {
    const csvString = csvBuffer.toString('utf8');
    
    // Parse CSV
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      const errorMsg = parsed.errors.map(e => `Fila ${e.row}: ${e.message}`).join(', ');
      throw new Error(`Error al parsear CSV: ${errorMsg}`);
    }

    const rows: CatalogoAcademicoImportRow[] = [];
    
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const result = CatalogoAcademicoSchema.safeParse(row);
      if (!result.success) {
        const errorMsg = result.error.errors.map(e => e.message).join(', ');
        throw new Error(`Error de validación en fila ${i + 1}: ${errorMsg}`);
      }
      rows.push(result.data);
    }

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      // Validate if ciclo exists
      const ciclo = await tx.cicloEscolar.findUnique({ where: { cicloId } });
      if (!ciclo) {
        throw new Error('El ciclo escolar especificado no existe.');
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          // 1. Find or create Nivel Educativo
          // Using a generic mapping for "codigo" based on name, or expecting it from frontend.
          // For simplicity, we create if it doesn't exist.
          let nivel = await tx.nivelEducativo.findFirst({
            where: { nombre: { equals: row['Nivel Educativo'], mode: 'insensitive' } }
          });
          
          if (!nivel) {
            const defaultCodigo = row['Nivel Educativo'].substring(0, 3).toUpperCase();
            // Let's check if codigo exists to avoid unique constraint error
            const existingNivel = await tx.nivelEducativo.findUnique({ where: { codigo: defaultCodigo }});
            if (existingNivel) {
               nivel = existingNivel; // Re-use if code matched (fallback)
            } else {
               nivel = await tx.nivelEducativo.create({
                 data: {
                   codigo: defaultCodigo,
                   nombre: row['Nivel Educativo'],
                   orden: 99
                 }
               });
            }
          }

          // 2. Find or create Grado
          let grado = await tx.grado.findFirst({
            where: { 
              nombre: { equals: row['Grado'], mode: 'insensitive' },
              nivelId: nivel.nivelId
            }
          });

          if (!grado) {
            grado = await tx.grado.create({
              data: {
                nombre: row['Grado'],
                numero: parseInt(row['Grado'].replace(/\D/g, '') || '1', 10),
                nivelId: nivel.nivelId
              }
            });
          }

          // 3. Find or create Grupo
          const grupoName = row['Nombre Grupo'];
          const grupoExistente = await tx.grupo.findFirst({
            where: {
              nombre: { equals: grupoName, mode: 'insensitive' },
              nivelId: nivel.nivelId,
              gradoId: grado.gradoId,
              cicloId: cicloId
            }
          });

          if (grupoExistente) {
             // throw new Error(`El grupo ${grupoName} ya existe para este nivel, grado y ciclo.`);
             // Update cupoMaximo instead of error
             await tx.grupo.update({
               where: { grupoId: grupoExistente.grupoId },
               data: { cupoMaximo: row['Cupo Máximo'] }
             });
          } else {
            await tx.grupo.create({
              data: {
                nombre: grupoName,
                nivelId: nivel.nivelId,
                gradoId: grado.gradoId,
                cicloId: cicloId,
                cupoMaximo: row['Cupo Máximo']
              }
            });
          }
        } catch (error: any) {
          throw new Error(`Fallo en la fila ${i + 1} (${row['Nivel Educativo']} - ${row['Grado']} - ${row['Nombre Grupo']}): ${error.message}`);
        }
      }
    });

    return { success: true, message: `Importación completada. Se procesaron ${rows.length} registros exitosamente.` };
  }

  async procesarImportacionInscripciones(csvBuffer: Buffer, cicloId: number): Promise<{ success: boolean; message: string }> {
    const csvString = csvBuffer.toString('utf8');
    
    // Parse CSV
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      const errorMsg = parsed.errors.map(e => `Fila ${e.row}: ${e.message}`).join(', ');
      throw new Error(`Error al parsear CSV: ${errorMsg}`);
    }

    const { InscripcionAlumnoSchema } = require('./importaciones.schema');
    const rows: any[] = [];
    
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const result = InscripcionAlumnoSchema.safeParse(row);
      if (!result.success) {
        const errorMsg = result.error.errors.map((e: any) => e.message).join(', ');
        throw new Error(`Error de validación en fila ${i + 1}: ${errorMsg}`);
      }
      rows.push(result.data);
    }

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      // Validate if ciclo exists
      const ciclo = await tx.cicloEscolar.findUnique({ where: { cicloId } });
      if (!ciclo) {
        throw new Error('El ciclo escolar especificado no existe.');
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          // 1. Validar jerarquía del grupo destino
          const nivel = await tx.nivelEducativo.findFirst({
            where: { nombre: { equals: row['Nivel Educativo Destino'], mode: 'insensitive' } }
          });
          if (!nivel) throw new Error(`El Nivel Educativo '${row['Nivel Educativo Destino']}' no existe.`);

          const grado = await tx.grado.findFirst({
            where: { nombre: { equals: row['Grado Destino'], mode: 'insensitive' }, nivelId: nivel.nivelId }
          });
          if (!grado) throw new Error(`El Grado '${row['Grado Destino']}' no existe en este Nivel.`);

          const grupo = await tx.grupo.findFirst({
            where: { nombre: { equals: row['Grupo Destino'], mode: 'insensitive' }, gradoId: grado.gradoId, cicloId }
          });
          if (!grupo) throw new Error(`El Grupo '${row['Grupo Destino']}' no existe en este Grado y Ciclo.`);

          // 2. Buscar o Crear Alumno
          let alumno;
          if (row['CURP Alumno'] || row['Matrícula']) {
            alumno = await tx.alumno.findFirst({
              where: {
                OR: [
                  ...(row['CURP Alumno'] ? [{ curp: row['CURP Alumno'] }] : []),
                  ...(row['Matrícula'] ? [{ matricula: row['Matrícula'] }] : [])
                ]
              }
            });
          }

          if (!alumno) {
            alumno = await tx.alumno.findFirst({
              where: { nombreCompleto: { equals: row['Nombre Alumno'], mode: 'insensitive' }, nivelId: nivel.nivelId }
            });
          }

          if (!alumno) {
            alumno = await tx.alumno.create({
              data: {
                nombreCompleto: row['Nombre Alumno'],
                curp: row['CURP Alumno'] || undefined,
                matricula: row['Matrícula'] || undefined,
                fechaNacimiento: new Date(row['Fecha Nacimiento']),
                sexo: row['Sexo'],
                estado: row['Estado Alumno'],
                nivelId: nivel.nivelId,
                gradoId: grado.gradoId,
              }
            });
          } else {
            // Actualizar nivel/grado si es diferente
            await tx.alumno.update({
              where: { alumnoId: alumno.alumnoId },
              data: {
                nivelId: nivel.nivelId,
                gradoId: grado.gradoId,
                estado: row['Estado Alumno']
              }
            });
          }

          // 3. Buscar o Crear Tutor
          let tutor = await tx.tutor.findFirst({
            where: { nombreCompleto: { equals: row['Nombre Tutor'], mode: 'insensitive' } }
          });

          if (!tutor) {
            tutor = await tx.tutor.create({
              data: {
                nombreCompleto: row['Nombre Tutor'],
                telefono: row['Teléfono Tutor'] || undefined,
                correoElectronico: row['Correo Tutor'] || undefined,
              }
            });
          }

          // 4. Vincular Tutor-Alumno
          const vinculo = await tx.tutorAlumno.findUnique({
            where: {
              tutorId_alumnoId: {
                tutorId: tutor.tutorId,
                alumnoId: alumno.alumnoId
              }
            }
          });

          if (!vinculo) {
            await tx.tutorAlumno.create({
              data: {
                tutorId: tutor.tutorId,
                alumnoId: alumno.alumnoId,
                parentesco: row['Parentesco'],
                esPrincipal: true
              }
            });
          }

          // 5. Inscribir Alumno al Ciclo y Grupo
          const inscripcion = await tx.inscripcionCiclo.findFirst({
            where: {
              alumnoId: alumno.alumnoId,
              cicloId: cicloId
            }
          });

          if (!inscripcion) {
            // Verificar cupo
            const inscripcionesGrupo = await tx.inscripcionCiclo.count({
              where: { grupoId: grupo.grupoId, estadoEnCiclo: 'ACTIVO' }
            });
            if (inscripcionesGrupo >= grupo.cupoMaximo) {
              throw new Error(`El grupo ${grupo.nombre} ya ha alcanzado su cupo máximo de ${grupo.cupoMaximo}`);
            }

            // Inscribir
            await tx.inscripcionCiclo.create({
              data: {
                alumnoId: alumno.alumnoId,
                cicloId: cicloId,
                gradoId: grado.gradoId,
                grupoId: grupo.grupoId,
                estadoEnCiclo: 'ACTIVO',
                estadoFinanciero: 'AL_CORRIENTE',
                fechaIngreso: new Date()
              }
            });
            // Omitimos calendario_pago en importación básica, puede generarse después con una función de utilidad
          }

        } catch (error: any) {
          throw new Error(`Fallo en la fila ${i + 1} (${row['Nombre Alumno']}): ${error.message}`);
        }
      }
    });

    return { success: true, message: `Importación completada. Se inscribieron ${rows.length} alumnos exitosamente.` };
  }

  async procesarImportacionPagos(csvBuffer: Buffer, cicloId: number): Promise<{ success: boolean; message: string }> {
    const csvString = csvBuffer.toString('utf8');
    
    // Parse CSV
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      const errorMsg = parsed.errors.map(e => `Fila ${e.row}: ${e.message}`).join(', ');
      throw new Error(`Error al parsear CSV: ${errorMsg}`);
    }

    const { PagosAnterioresSchema } = require('./importaciones.schema');
    const rows: any[] = [];
    
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const result = PagosAnterioresSchema.safeParse(row);
      if (!result.success) {
        const errorMsg = result.error.errors.map((e: any) => e.message).join(', ');
        throw new Error(`Error de validación en fila ${i + 1}: ${errorMsg}`);
      }
      rows.push(result.data);
    }

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      const ciclo = await tx.cicloEscolar.findUnique({ where: { cicloId } });
      if (!ciclo) {
        throw new Error('El ciclo escolar especificado no existe.');
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          // 1. Buscar Alumno
          let alumno;
          if (row['CURP Alumno'] || row['Matrícula']) {
            alumno = await tx.alumno.findFirst({
              where: {
                OR: [
                  ...(row['CURP Alumno'] ? [{ curp: row['CURP Alumno'] }] : []),
                  ...(row['Matrícula'] ? [{ matricula: row['Matrícula'] }] : [])
                ]
              }
            });
          }

          if (!alumno) {
            alumno = await tx.alumno.findFirst({
              where: { nombreCompleto: { equals: row['Nombre Alumno'], mode: 'insensitive' } }
            });
          }

          if (!alumno) throw new Error(`El alumno no fue encontrado.`);

          // 2. Buscar Tutor Principal
          const vinculacion = await tx.tutorAlumno.findFirst({
            where: { alumnoId: alumno.alumnoId, esPrincipal: true },
            include: { tutor: true }
          });
          const tutor = vinculacion ? vinculacion.tutor : await tx.tutor.findFirst({
            where: { tutoresAlumnos: { some: { alumnoId: alumno.alumnoId } } }
          });

          if (!tutor) throw new Error(`El alumno no tiene un tutor registrado para asignar el pago.`);

          // 3. Crear Pago
          await tx.pago.create({
            data: {
              alumnoId: alumno.alumnoId,
              tutorId: tutor.tutorId,
              fechaPago: new Date(row['Fecha Pago']),
              montoTotal: row['Monto Total'],
              metodoPago: row['Método Pago'],
              observaciones: row['Observaciones'] || 'Importación Inicial',
              registradoPor: 1 // Default usuario sistema
            }
          });

        } catch (error: any) {
          throw new Error(`Fallo en la fila ${i + 1} (${row['Nombre Alumno']}): ${error.message}`);
        }
      }
    });

    return { success: true, message: `Importación completada. Se registraron ${rows.length} pagos exitosamente.` };
  }

  async procesarImportacionSaldos(csvBuffer: Buffer, cicloId: number): Promise<{ success: boolean; message: string }> {
    const csvString = csvBuffer.toString('utf8');
    
    // Parse CSV
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      const errorMsg = parsed.errors.map(e => `Fila ${e.row}: ${e.message}`).join(', ');
      throw new Error(`Error al parsear CSV: ${errorMsg}`);
    }

    const { SaldosInicialesSchema } = require('./importaciones.schema');
    const rows: any[] = [];
    
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const result = SaldosInicialesSchema.safeParse(row);
      if (!result.success) {
        const errorMsg = result.error.errors.map((e: any) => e.message).join(', ');
        throw new Error(`Error de validación en fila ${i + 1}: ${errorMsg}`);
      }
      rows.push(result.data);
    }

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      const ciclo = await tx.cicloEscolar.findUnique({ where: { cicloId } });
      if (!ciclo) {
        throw new Error('El ciclo escolar especificado no existe.');
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          // 1. Buscar Alumno
          let alumno;
          if (row['CURP Alumno'] || row['Matrícula']) {
            alumno = await tx.alumno.findFirst({
              where: {
                OR: [
                  ...(row['CURP Alumno'] ? [{ curp: row['CURP Alumno'] }] : []),
                  ...(row['Matrícula'] ? [{ matricula: row['Matrícula'] }] : [])
                ]
              }
            });
          }

          if (!alumno) {
            alumno = await tx.alumno.findFirst({
              where: { nombreCompleto: { equals: row['Nombre Alumno'], mode: 'insensitive' } }
            });
          }

          if (!alumno) throw new Error(`El alumno no fue encontrado.`);

          // 2. Crear Saldo Inicial en CalendarioPago
          const montoOriginal = row['Monto Original'];
          const montoPagado = row['Monto Pagado'];
          const saldoPendiente = montoOriginal - montoPagado;

          await tx.calendarioPago.create({
            data: {
              alumnoId: alumno.alumnoId,
              cicloId: ciclo.cicloId,
              concepto: row['Concepto'],
              mes: row['Mes'] || null,
              fechaVencimiento: new Date(row['Fecha Vencimiento']),
              montoOriginal,
              montoPagado,
              saldoPendiente,
              estadoCobro: row['Estado Cobro'],
            }
          });

        } catch (error: any) {
          throw new Error(`Fallo en la fila ${i + 1} (${row['Nombre Alumno']}): ${error.message}`);
        }
      }
    });

    return { success: true, message: `Importación completada. Se registraron ${rows.length} saldos iniciales exitosamente.` };
  }
}

export const importacionesService = new ImportacionesService();
