import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import type {
  CreateNivelEducativoInput, UpdateNivelEducativoInput,
  CreateGradoInput, UpdateGradoInput,
  CreateCicloEscolarInput, UpdateCicloEscolarInput,
  CreateMateriaInput, UpdateMateriaInput,
  CreateGrupoInput, UpdateGrupoInput,
  AssignMateriaGrupoInput, UnassignMateriaGrupoInput,
  CerrarCicloGrupoInput,
  InicializarGruposSeleccionadosInput,
  TransicionCicloInput, CerrarCicloInput,
  InscribirAlumnosTransicionInput
} from './grupos.schema';
import { GruposRepository } from './grupos.repository';

const CONSTANT_NIVELES = [
  { codigo: 'PRE', nombre: 'Preescolar', orden: 1 },
  { codigo: 'PRI', nombre: 'Primaria', orden: 2 },
  { codigo: 'SEC', nombre: 'Secundaria', orden: 3 },
  { codigo: 'BAC', nombre: 'Bachillerato', orden: 4 }
];

const CONSTANT_GRADOS = [
  // Preescolar
  { nivelCodigo: 'PRE', numero: 1, nombre: '1º Grado' },
  { nivelCodigo: 'PRE', numero: 2, nombre: '2º Grado' },
  { nivelCodigo: 'PRE', numero: 3, nombre: '3º Grado' },
  // Primaria
  { nivelCodigo: 'PRI', numero: 1, nombre: '1º Grado' },
  { nivelCodigo: 'PRI', numero: 2, nombre: '2º Grado' },
  { nivelCodigo: 'PRI', numero: 3, nombre: '3º Grado' },
  { nivelCodigo: 'PRI', numero: 4, nombre: '4º Grado' },
  { nivelCodigo: 'PRI', numero: 5, nombre: '5º Grado' },
  { nivelCodigo: 'PRI', numero: 6, nombre: '6º Grado' },
  // Secundaria
  { nivelCodigo: 'SEC', numero: 1, nombre: '1º Grado' },
  { nivelCodigo: 'SEC', numero: 2, nombre: '2º Grado' },
  { nivelCodigo: 'SEC', numero: 3, nombre: '3º Grado' },
  // Bachillerato
  { nivelCodigo: 'BAC', numero: 1, nombre: '1º Semestre' },
  { nivelCodigo: 'BAC', numero: 2, nombre: '2º Semestre' },
  { nivelCodigo: 'BAC', numero: 3, nombre: '3º Semestre' },
  { nivelCodigo: 'BAC', numero: 4, nombre: '4º Semestre' },
  { nivelCodigo: 'BAC', numero: 5, nombre: '5º Semestre' },
  { nivelCodigo: 'BAC', numero: 6, nombre: '6º Semestre' }
];

export class GruposService {
  private static initialized = false;

  static async ensureNivelesYGrados() {
    if (this.initialized || process.env.NODE_ENV === 'test') return;

    try {
      // 1. Obtener niveles existentes
      let dbNiveles = await prisma.nivelEducativo.findMany({ where: { eliminadoEn: null } });

      for (const cn of CONSTANT_NIVELES) {
        let exist = dbNiveles.find(n => n.codigo === cn.codigo);
        if (!exist) {
          exist = await prisma.nivelEducativo.create({
            data: { codigo: cn.codigo, nombre: cn.nombre, orden: cn.orden }
          });
          dbNiveles.push(exist);
        }
      }

      // 2. Obtener grados existentes
      const dbGrados = await prisma.grado.findMany({ where: { eliminadoEn: null } });

      for (const cg of CONSTANT_GRADOS) {
        const associatedNivel = dbNiveles.find(n => n.codigo === cg.nivelCodigo);
        if (!associatedNivel) continue;

        const exist = dbGrados.find(g => g.nivelId === associatedNivel.nivelId && g.numero === cg.numero);
        if (!exist) {
          await prisma.grado.create({
            data: {
              nivelId: associatedNivel.nivelId,
              numero: cg.numero,
              nombre: cg.nombre
            }
          });
        } else if (exist.nombre !== cg.nombre) {
          await prisma.grado.update({
            where: { gradoId: exist.gradoId },
            data: { nombre: cg.nombre }
          });
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error al inicializar niveles y grados constantes:', error);
    }
  }

  // --- Niveles Educativos ---
  static async getNiveles() {
    await this.ensureNivelesYGrados();
    return GruposRepository.getNiveles();
  }

  static async createNivel(input: CreateNivelEducativoInput) {
    return GruposRepository.createNivel(input);
  }

  static async updateNivel(input: UpdateNivelEducativoInput) {
    const { nivelId, ...data } = input;
    return GruposRepository.updateNivel(nivelId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteNivel(nivelId: number) {
    return GruposRepository.deleteNivel(nivelId);
  }

  // --- Grados ---
  static async getGrados() {
    await this.ensureNivelesYGrados();
    return GruposRepository.getGrados();
  }

  static async createGrado(input: CreateGradoInput) {
    return GruposRepository.createGrado(input);
  }

  static async updateGrado(input: UpdateGradoInput) {
    const { gradoId, ...data } = input;
    return GruposRepository.updateGrado(gradoId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteGrado(gradoId: number) {
    // 1. Validar que no tenga grupos asociados
    const grupoExistente = await prisma.grupo.findFirst({
      where: { gradoId, eliminadoEn: null }
    });
    if (grupoExistente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar el grado porque tiene grupos asociados.'
      });
    }

    // 2. Validar que no tenga alumnos asociados
    const alumnoExistente = await prisma.alumno.findFirst({
      where: { gradoId, eliminadoEn: null }
    });
    if (alumnoExistente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar el grado porque tiene alumnos asociados.'
      });
    }

    // 3. Validar que no tenga materias asociadas
    const materiaExistente = await prisma.materia.findFirst({
      where: { gradoId, eliminadoEn: null }
    });
    if (materiaExistente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar el grado porque tiene materias asociadas.'
      });
    }

    return GruposRepository.deleteGrado(gradoId);
  }

  // --- Ciclos Escolares ---
  static async getCiclos() {
    const ciclos = await GruposRepository.getCiclos();
    return ciclos.map(c => ({
      ...c,
      gradosPermitidos: c.gradosPermitidos as Record<string, number[]> | null
    }));
  }

  static async createCiclo(input: CreateCicloEscolarInput) {
    let gradosPermitidos = input.gradosPermitidos;
    const { clonarGruposDesdeCicloId, clonarTarifasDesdeCicloId, ...cicloData } = input;

    if (!gradosPermitidos) {
      const per = input.periodicidad || 'ANUAL';
      const nivCodigos = per === 'ANUAL' ? ['PRE', 'PRI', 'SEC'] : ['BAC'];
      const grados = await prisma.grado.findMany({
        where: { nivel: { codigo: { in: nivCodigos } }, eliminadoEn: null }
      });
      gradosPermitidos = grados.reduce((acc, curr) => {
        const nId = curr.nivelId.toString();
        if (!acc[nId]) acc[nId] = [];
        acc[nId].push(curr.gradoId);
        return acc;
      }, {} as Record<string, number[]>);
    }

    const c = await GruposRepository.createCiclo({
      ...cicloData,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin),
      gradosPermitidos
    });

    if (clonarGruposDesdeCicloId || clonarTarifasDesdeCicloId) {
      await this.clonarCicloEstructura(c.cicloId, clonarGruposDesdeCicloId, clonarTarifasDesdeCicloId);
    }

    return {
      ...c,
      gradosPermitidos: c.gradosPermitidos as Record<string, number[]> | null
    };
  }

  private static async clonarCicloEstructura(cicloDestinoId: number, clonarGruposDesdeCicloId?: number, clonarTarifasDesdeCicloId?: number) {
    if (clonarGruposDesdeCicloId) {
      // Clonar Grupos
      const gruposOrigen = await prisma.grupo.findMany({
        where: { cicloId: clonarGruposDesdeCicloId, eliminadoEn: null },
        include: { materias: true }
      });

      for (const grupo of gruposOrigen) {
        const nuevoGrupo = await prisma.grupo.create({
          data: {
            nivelId: grupo.nivelId,
            cicloId: cicloDestinoId,
            nombre: grupo.nombre,
            cupoMaximo: grupo.cupoMaximo,
            gradoId: grupo.gradoId
          }
        });

        // Clonar Materias
        for (const gm of grupo.materias) {
          await prisma.grupoMateria.create({
            data: {
              grupoId: nuevoGrupo.grupoId,
              materiaId: gm.materiaId,
              docenteId: gm.docenteId // Se clona el docente, se puede editar luego
            }
          });
        }
      }
    }

    // Clonar Tarifas
    if (clonarTarifasDesdeCicloId) {
      const tarifasOrigen = await prisma.tarifa.findMany({
        where: { cicloId: clonarTarifasDesdeCicloId, eliminadoEn: null, activa: true }
      });
      for (const t of tarifasOrigen) {
        await prisma.tarifa.create({
          data: {
            cicloId: cicloDestinoId,
            nivelId: t.nivelId,
            concepto: t.concepto,
            monto: t.monto,
            descripcion: t.descripcion,
            activa: true
          }
        });
      }
    }
  }

  static async cerrarCiclo(input: CerrarCicloInput) {
    const ciclo = await prisma.cicloEscolar.findUnique({ where: { cicloId: input.cicloId } });
    if (!ciclo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ciclo no encontrado' });

    // Validar que todos los grupos estén cerrados
    const gruposAbiertos = await prisma.grupo.findMany({
      where: { cicloId: input.cicloId, cerrado: false, eliminadoEn: null }
    });

    if (gruposAbiertos.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Faltan grupos por cerrar (${gruposAbiertos.map(g => g.nombre).join(', ')})`
      });
    }

    await prisma.cicloEscolar.update({
      where: { cicloId: input.cicloId },
      data: { abierto: false }
    });

    return { success: true };
  }

  static async transicionCiclo(input: TransicionCicloInput) {
    // 1. Cerrar ciclo actual (Valida grupos también)
    await this.cerrarCiclo({ cicloId: input.cicloActualId });

    // 2. Validar ciclo destino (que esté vacío de alumnos)
    const inscripcionesDestino = await prisma.inscripcionCiclo.count({
      where: { cicloId: input.cicloDestinoId, eliminadoEn: null }
    });

    if (inscripcionesDestino > 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este ciclo escolar ya está cerrado o tiene alumnos vinculados.' });
    }

    // 3. Inscribir alumnos seleccionados en los grupos destino
    for (const [grupoDestinoIdStr, alumnoIds] of Object.entries(input.alumnosPorGrupo)) {
      const grupoDestinoId = parseInt(grupoDestinoIdStr, 10);
      const grupo = await prisma.grupo.findUnique({ where: { grupoId: grupoDestinoId } });
      if (!grupo) continue;

      for (const alumnoId of alumnoIds) {
        await prisma.inscripcionCiclo.create({
          data: {
            alumnoId,
            cicloId: input.cicloDestinoId,
            grupoId: grupoDestinoId,
            estadoEnCiclo: 'INSCRITO',
            fechaIngreso: new Date(),
            estadoFinanciero: 'AL_CORRIENTE'
          }
        });
      }
    }

    return { success: true };
  }

  static async inscribirAlumnosTransicion(input: InscribirAlumnosTransicionInput) {
    // Validar ciclo destino
    const cicloDestino = await prisma.cicloEscolar.findUnique({
      where: { cicloId: input.cicloDestinoId, eliminadoEn: null }
    });

    if (!cicloDestino) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Ciclo destino no encontrado.' });
    }

    return prisma.$transaction(async (tx) => {
      let inscritos = 0;
      for (const [grupoDestinoIdStr, alumnoIds] of Object.entries(input.alumnosPorGrupo)) {
        const grupoDestinoId = parseInt(grupoDestinoIdStr, 10);
        const grupo = await tx.grupo.findUnique({ where: { grupoId: grupoDestinoId } });
        if (!grupo) continue;

        for (const alumnoId of alumnoIds) {
          // Check if already enrolled
          const existing = await tx.inscripcionCiclo.findFirst({
            where: { alumnoId, cicloId: input.cicloDestinoId, eliminadoEn: null }
          });
          if (existing) continue;

          // Find most recent previous inscription to copy planPagoId
          const previousInscripcion = await tx.inscripcionCiclo.findFirst({
            where: { alumnoId, eliminadoEn: null },
            orderBy: { fechaIngreso: 'desc' }
          });

          await tx.inscripcionCiclo.create({
            data: {
              alumnoId,
              cicloId: input.cicloDestinoId,
              grupoId: grupoDestinoId,
              planPagoId: previousInscripcion?.planPagoId || null,
              estadoEnCiclo: 'INSCRITO',
              fechaIngreso: new Date(),
              estadoFinanciero: 'AL_CORRIENTE'
            }
          });

          // Update student status to PREINSCRIPCION
          await tx.alumno.update({
            where: { alumnoId },
            data: { estado: 'PREINSCRIPCION', actualizadoEn: new Date() }
          });
          inscritos++;
        }
      }
      return { success: true, inscritos };
    });
  }

  static async limpiarRetenidosTransicion() {
    return prisma.$transaction(async (tx) => {
      const result = await tx.alumno.updateMany({
        where: {
          estado: { in: ['RETENCION_FINANCIERA', 'RETENCION_ACADEMICA'] },
          eliminadoEn: null
        },
        data: {
          estado: 'BAJA_DEFINITIVA',
          actualizadoEn: new Date()
        }
      });
      return { success: true, actualizados: result.count };
    });
  }

  static async updateCiclo(input: UpdateCicloEscolarInput) {
    const { cicloId, fechaInicio, fechaFin, ...data } = input;

    const updateData = {
      ...data,
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      actualizadoEn: new Date()
    };

    let result;
    if (data.activo) {
      await GruposRepository.updateCicloActivo(cicloId, updateData);
      result = await GruposRepository.findCiclo(cicloId);
    } else {
      result = await GruposRepository.updateCicloDirectly(cicloId, updateData);
    }

    if (!result) return null;
    return {
      ...result,
      gradosPermitidos: result.gradosPermitidos as Record<string, number[]> | null
    };
  }

  static async deleteCiclo(cicloId: number) {
    // 1. No se puede eliminar ningún ciclo escolar que ya tenga registrado un pago.
    const pagoExistente = await prisma.aplicacionPago.findFirst({
      where: {
        calendarioPago: { cicloId }
      }
    });

    if (pagoExistente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar el ciclo escolar porque ya tiene registrado al menos un pago.'
      });
    }

    // 2. Solo se puede eliminar un ciclo escolar si no tiene alumnos inscritos (se cubren tanto activos como inactivos).
    const inscripcionExistente = await prisma.inscripcionCiclo.findFirst({
      where: { cicloId }
    });

    if (inscripcionExistente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar el ciclo escolar porque tiene alumnos inscritos.'
      });
    }

    const deleted = await GruposRepository.deleteCiclo(cicloId);
    return {
      ...deleted,
      gradosPermitidos: deleted.gradosPermitidos as Record<string, number[]> | null
    };
  }

  // --- Materias ---
  static async getMaterias() {
    return GruposRepository.getMaterias();
  }

  static async createMateria(input: CreateMateriaInput) {
    let { clave, grupoId, ...data } = input;

    let gradoId = data.gradoId;
    if (grupoId) {
      const grupo = await prisma.grupo.findUnique({
        where: { grupoId, eliminadoEn: null }
      });
      if (grupo) {
        gradoId = grupo.gradoId;
      }
    }

    if (!clave) {
      let prefix = data.nombre
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 4);

      if (prefix.length < 3) {
        prefix = (prefix + 'MAT').substring(0, 3);
      }

      let count = 1;
      clave = `${prefix}-${String(count).padStart(3, '0')}`;
      let exists = await prisma.materia.findFirst({
        where: { clave, eliminadoEn: null }
      });

      while (exists) {
        count++;
        clave = `${prefix}-${String(count).padStart(3, '0')}`;
        exists = await prisma.materia.findFirst({
          where: { clave, eliminadoEn: null }
        });
      }
    }

    const materia = await GruposRepository.createMateria({
      ...data,
      gradoId,
      clave
    });

    if (grupoId) {
      await prisma.grupoMateria.create({
        data: {
          grupoId,
          materiaId: materia.materiaId,
          docenteId: data.docenteId || null
        }
      });
    }

    return materia;
  }

  static async updateMateria(input: UpdateMateriaInput) {
    const { materiaId, grupoId, ...data } = input;

    let gradoId = data.gradoId;
    if (grupoId) {
      const grupo = await prisma.grupo.findUnique({
        where: { grupoId, eliminadoEn: null }
      });
      if (grupo) {
        gradoId = grupo.gradoId;
      }
    }

    const updatedMateria = await GruposRepository.updateMateria(materiaId, {
      ...data,
      ...(gradoId !== undefined && { gradoId }),
      actualizadoEn: new Date()
    });

    if (grupoId) {
      const existRelation = await prisma.grupoMateria.findFirst({
        where: { materiaId, grupoId }
      });
      if (!existRelation) {
        // Eliminar relaciones anteriores
        await prisma.grupoMateria.deleteMany({
          where: { materiaId }
        });

        await prisma.grupoMateria.create({
          data: {
            grupoId,
            materiaId,
            docenteId: data.docenteId || null
          }
        });
      } else if (data.docenteId !== undefined) {
        await prisma.grupoMateria.update({
          where: { grupoMateriaId: existRelation.grupoMateriaId },
          data: { docenteId: data.docenteId || null }
        });
      }
    } else if (grupoId === null) {
      await prisma.grupoMateria.deleteMany({
        where: { materiaId }
      });
    }

    return updatedMateria;
  }

  static async deleteMateria(materiaId: number) {
    return GruposRepository.deleteMateria(materiaId);
  }

  // --- Grupos ---
  static async getGrupos(cicloId?: number) {
    return GruposRepository.getGrupos(cicloId);
  }

  static async createGrupo(input: CreateGrupoInput) {
    const ciclo = await prisma.cicloEscolar.findUnique({
      where: { cicloId: input.cicloId, eliminadoEn: null }
    });

    if (!ciclo) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Ciclo escolar no encontrado.' });
    }

    // GAP 3: Extraer el semestre o grado a partir de la propiedad nombre (ej. "1A" -> 1)
    const match = input.nombre.match(/^(\d+)/);
    if (match) {
      const numeroGrado = parseInt(match[1], 10);
      const gradosPermitidos = ciclo.gradosPermitidos as Record<string, number[]> | null;

      let gradoPermitido = false;
      if (gradosPermitidos) {
        // Find if this number exists in any of the allowed levels
        for (const nivel of Object.values(gradosPermitidos)) {
          // Buscamos el ID del grado en DB
          const gradosDb = await prisma.grado.findMany({
            where: { gradoId: { in: nivel }, eliminadoEn: null }
          });
          if (gradosDb.some(g => g.numero === numeroGrado)) {
            gradoPermitido = true;
            break;
          }
        }
      }

      if (!gradoPermitido) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `El grado/semestre ${numeroGrado} extraído del grupo "${input.nombre}" no está habilitado en los grados permitidos del ciclo escolar.`
        });
      }
    }

    return GruposRepository.createGrupo(input);
  }

  static async updateGrupo(input: UpdateGrupoInput) {
    const { grupoId, ...data } = input;
    return GruposRepository.updateGrupo(grupoId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteGrupo(grupoId: number) {
    return GruposRepository.deleteGrupo(grupoId);
  }

  // --- Asignación Materias a Grupos ---
  static async assignMateriaToGrupo(input: AssignMateriaGrupoInput) {
    return GruposRepository.assignMateriaToGrupo(input);
  }

  static async unassignMateriaFromGrupo(input: UnassignMateriaGrupoInput) {
    return GruposRepository.unassignMateriaFromGrupo(input.grupoMateriaId);
  }

  // --- Cierre de Ciclo por Grupos ---
  static async getAlumnosCierreGrupo(grupoId: number) {
    const grupo = await GruposRepository.findGrupoWithCiclo(grupoId);
    if (!grupo) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo no encontrado' });
    }

    // Obtener inscripciones de alumnos en este grupo y ciclo
    const inscripciones = await prisma.inscripcionCiclo.findMany({
      where: {
        grupoId,
        cicloId: grupo.cicloId,
        eliminadoEn: null
      },
      include: {
        alumno: true
      }
    });

    const result = [];
    for (const insc of inscripciones) {
      const alumnoId = insc.alumnoId;

      // 1. Verificar si tiene adeudos vencidos
      const adeudos = await prisma.calendarioPago.findMany({
        where: {
          alumnoId,
          cicloId: grupo.cicloId,
          eliminadoEn: null,
          estadoCobro: { in: ['VENCIDO', 'PENDIENTE'] }
        }
      });
      const tieneAdeudo = adeudos.some(a =>
        a.estadoCobro === 'VENCIDO' ||
        (a.estadoCobro === 'PENDIENTE' && new Date(a.fechaVencimiento) < new Date())
      );

      // 2. Verificar si tiene materias reprobadas en este grupo
      const calificaciones = await prisma.calificacion.findMany({
        where: {
          alumnoId,
          grupoMateria: { grupoId }
        }
      });
      const tieneReprobadas = calificaciones.some(c =>
        (c.valorNumerico !== null && Number(c.valorNumerico) < 6.0) ||
        c.valorCualitativo === 'NA'
      );

      result.push({
        alumnoId: insc.alumno.alumnoId,
        matricula: insc.alumno.matricula || '',
        nombreCompleto: insc.alumno.nombreCompleto,
        curp: insc.alumno.curp,
        tieneAdeudo,
        tieneReprobadas
      });
    }

    return result;
  }

  static async cerrarCicloGrupo(input: CerrarCicloGrupoInput) {
    const { grupoId, promociones } = input;
    const grupoBase = await GruposRepository.findGrupoWithCiclo(grupoId);
    if (!grupoBase) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo no encontrado' });
    }

    if ((grupoBase as any).cerrado) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'El ciclo escolar de este grupo ya está cerrado.' });
    }

    // Obtener grupo con grado y nivel para validación de egresado
    const grupo = await prisma.grupo.findUnique({
      where: { grupoId },
      include: { grado: true }
    });
    
    let esUltimoGrado = false;
    if (grupo && grupo.grado) {
      const gradosNivel = await prisma.grado.findMany({
        where: { nivelId: grupo.grado.nivelId, eliminadoEn: null },
        orderBy: { numero: 'desc' },
        take: 1
      });
      esUltimoGrado = gradosNivel.length > 0 && gradosNivel[0].gradoId === grupo.gradoId;
    }

    // Ejecutar transacción
    return prisma.$transaction(async (tx) => {
      // 1. Marcar el grupo como cerrado
      await tx.grupo.update({
        where: { grupoId },
        data: { cerrado: true, actualizadoEn: new Date() } as any
      });

      // 2. Procesar promociones y estatus de los alumnos
      for (const promo of promociones) {
        const { alumnoId, promover, motivoRetencionOverride } = promo as any;

        let nuevoEstadoGeneral = 'TRANSICION_PENDIENTE';

        if (promover) {
          if (esUltimoGrado) {
            nuevoEstadoGeneral = 'EGRESADO';
          }
        } else {
          if (motivoRetencionOverride) {
            nuevoEstadoGeneral = motivoRetencionOverride;
          } else {
            // Deducción automática
            const deuda = await tx.calendarioPago.findFirst({
              where: { alumnoId, estadoCobro: 'VENCIDO', eliminadoEn: null }
            });

            if (deuda) {
              nuevoEstadoGeneral = 'RETENCION_FINANCIERA';
            } else {
              const materiasReprobadas = await tx.calificacion.findFirst({
                where: { 
                  alumnoId, 
                  valorNumerico: { lt: 6.0 }, 
                  grupoMateria: { grupoId }
                }
              });
              
              if (materiasReprobadas) {
                nuevoEstadoGeneral = 'RETENCION_ACADEMICA';
              } else {
                nuevoEstadoGeneral = 'BAJA_DEFINITIVA';
              }
            }
          }
        }

        // Actualizar estatus de inscripción
        await tx.inscripcionCiclo.updateMany({
          where: {
            alumnoId,
            grupoId,
            cicloId: grupoBase.cicloId,
            eliminadoEn: null
          },
          data: {
            estadoEnCiclo: promover ? 'PROMOVIDO' : 'RETENIDO',
            actualizadoEn: new Date()
          }
        });

        // Actualizar estado general del alumno
        await tx.alumno.update({
          where: { alumnoId },
          data: {
            estado: nuevoEstadoGeneral as any,
            actualizadoEn: new Date()
          }
        });
      }

      return { success: true };
    });
  }

  // --- Inicialización Selectiva de Grupos ---
  static async getGradosParaInicializar(cicloId: number) {
    const ciclo = await prisma.cicloEscolar.findUnique({
      where: { cicloId, eliminadoEn: null }
    });

    if (!ciclo) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Ciclo escolar no encontrado.'
      });
    }

    const gradosPermitidos = ciclo.gradosPermitidos as Record<string, number[]> | null;
    if (!gradosPermitidos || Object.keys(gradosPermitidos).length === 0) {
      return [];
    }

    // Aplanar todos los grados permitidos en un array simple de IDs
    const gradoIds = Object.values(gradosPermitidos).flat();

    // Obtener los grados de la base de datos
    const grados = await prisma.grado.findMany({
      where: {
        gradoId: { in: gradoIds },
        eliminadoEn: null
      },
      include: {
        nivel: true
      },
      orderBy: { numero: 'asc' }
    });

    // Consultar grupos que ya existen para este ciclo
    const gruposExistentes = await prisma.grupo.findMany({
      where: {
        cicloId,
        eliminadoEn: null
      },
      select: { gradoId: true }
    });

    const gradoIdsExistentes = new Set(gruposExistentes.map(g => g.gradoId));

    // Filtrar los grados que ya tienen un grupo creado y mapear al formato deseado
    const gradosDisponibles = grados
      .filter(g => !gradoIdsExistentes.has(g.gradoId))
      .map(grado => ({
        gradoId: grado.gradoId,
        nombreGrado: grado.nombre,
        nivelId: grado.nivelId,
        nombreNivel: grado.nivel.nombre,
        nombrePropuesto: `${grado.numero}A`
      }));

    return gradosDisponibles;
  }

  static async inicializarGruposSeleccionados(input: InicializarGruposSeleccionadosInput) {
    const { cicloId, grupos } = input;

    const ciclo = await prisma.cicloEscolar.findUnique({
      where: { cicloId, eliminadoEn: null }
    });

    if (!ciclo) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Ciclo escolar no encontrado.'
      });
    }

    if (grupos.length === 0) {
      return { success: true, count: 0 };
    }

    // Iniciar transacción
    return prisma.$transaction(async (tx) => {
      let count = 0;
      for (const item of grupos) {
        // Obtener el grado para saber el nivelId correspondiente
        const grado = await tx.grado.findUnique({
          where: { gradoId: item.gradoId, eliminadoEn: null }
        });

        if (!grado) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Grado con ID ${item.gradoId} no encontrado o eliminado.`
          });
        }

        // Validar si ya existe el grupo en ese ciclo
        const existente = await tx.grupo.findFirst({
          where: {
            cicloId,
            gradoId: item.gradoId,
            nombre: item.nombre,
            eliminadoEn: null
          }
        });

        if (existente) {
          continue; // Omitir duplicados si ya existen
        }

        await tx.grupo.create({
          data: {
            nivelId: grado.nivelId,
            cicloId,
            gradoId: item.gradoId,
            nombre: item.nombre,
            cupoMaximo: item.cupoMaximo ?? 30
          }
        });
        count++;
      }

      return { success: true, count };
    });
  }

  static async getDocentes() {
    return prisma.usuario.findMany({
      where: {
        eliminadoEn: null,
        activo: true,
        roles: {
          some: {
            rol: { codigo: 'DOCENTE' },
            eliminadoEn: null
          }
        }
      },
      select: {
        usuarioId: true,
        nombreCompleto: true
      },
      orderBy: {
        nombreCompleto: 'asc'
      }
    });
  }
}

