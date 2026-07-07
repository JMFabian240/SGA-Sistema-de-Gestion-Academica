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
  GetGradosParaInicializarInput, InicializarGruposSeleccionadosInput
} from './grupos.schema';
import { GruposRepository } from './grupos.repository';

export class GruposService {
  // --- Niveles Educativos ---
  static async getNiveles() {
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
    const c = await GruposRepository.createCiclo({
      ...input,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin)
    });
    return {
      ...c,
      gradosPermitidos: c.gradosPermitidos as Record<string, number[]> | null
    };
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
    return GruposRepository.createMateria(input);
  }

  static async updateMateria(input: UpdateMateriaInput) {
    const { materiaId, ...data } = input;
    return GruposRepository.updateMateria(materiaId, { ...data, actualizadoEn: new Date() });
  }

  static async deleteMateria(materiaId: number) {
    return GruposRepository.deleteMateria(materiaId);
  }

  // --- Grupos ---
  static async getGrupos(cicloId?: number) {
    return GruposRepository.getGrupos(cicloId);
  }

  static async createGrupo(input: CreateGrupoInput) {
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
    const grupo = await GruposRepository.findGrupoWithCiclo(grupoId);
    if (!grupo) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo no encontrado' });
    }

    if ((grupo as any).cerrado) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'El ciclo escolar de este grupo ya está cerrado.' });
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
        const { alumnoId, promover } = promo;

        // Actualizar estatus de inscripción
        await tx.inscripcionCiclo.updateMany({
          where: {
            alumnoId,
            grupoId,
            cicloId: grupo.cicloId,
            eliminadoEn: null
          },
          data: {
            estadoEnCiclo: promover ? 'PROMOVIDO' : 'RETENIDO',
            actualizadoEn: new Date()
          }
        });

        // Actualizar estado general del alumno a TRANSICION_PENDIENTE
        await tx.alumno.update({
          where: { alumnoId },
          data: {
            estado: 'TRANSICION_PENDIENTE',
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
}

