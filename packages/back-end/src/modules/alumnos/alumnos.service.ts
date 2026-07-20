import { prisma, EstadoCobro } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import { AlumnosRepository } from './alumnos.repository';
import type {
  CreateAlumnoInput, UpdateAlumnoInput,
  LinkTutorInput, UnlinkTutorInput
} from './alumnos.schema';

export class AlumnosService {
  /**
   * Obtiene la lista de alumnos activos
   */
  static async getAlumnos() {
    return AlumnosRepository.getAlumnosActivos();
  }

  /**
   * Obtiene los detalles de un alumno específico
   */
  static async getAlumnoById(alumnoId: number) {
    const alumno = await AlumnosRepository.getAlumnoDetail(alumnoId);

    if (!alumno || alumno.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' });
    }

    return alumno;
  }

  static async createAlumno(input: CreateAlumnoInput) {
    // Verificar si el CURP o la matrícula ya están en uso
    const curpStr = input.curp?.trim() || null;
    const matriculaStr = input.matricula?.trim() || null;

    if (curpStr || matriculaStr) {
      const existing = await AlumnosRepository.findAlumnoByCurpOrMatricula(curpStr || '', matriculaStr);

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ya existe un alumno con ese CURP o Matrícula'
        });
      }
    }

    const { fechaNacimiento, personasAutorizadas, gradoId, grupoId, planPagoId, curp, matricula, ...rest } = input;

    return prisma.$transaction(async (tx) => {
      // 1. Crear el alumno básico
      const alumno = await tx.alumno.create({
        data: {
          ...rest,
          curp: curpStr,
          matricula: matriculaStr,
          fechaNacimiento: new Date(fechaNacimiento),
          personasAutorizadas: personasAutorizadas ?? null,
          gradoId: gradoId || null
        } as any
      });

      // 2. Si hay grado y grupo, intentar inscribir al ciclo activo
      if (gradoId && grupoId) {
        const nivel = await tx.nivelEducativo.findUnique({
          where: { nivelId: input.nivelId }
        });
        const periodicidad = nivel?.codigo === 'BAC' ? 'SEMESTRAL' : 'ANUAL';

        const cicloActivo = await tx.cicloEscolar.findFirst({
          where: { activo: true, eliminadoEn: null, periodicidad },
          orderBy: { fechaInicio: 'desc' }
        });

        if (cicloActivo) {
          // Validar capacidad del grupo
          const grupoTarget = await tx.grupo.findUnique({
            where: { grupoId },
            include: {
              _count: {
                select: { inscripciones: { where: { estadoEnCiclo: 'INSCRITO', eliminadoEn: null } } }
              }
            }
          });

          if (grupoTarget && grupoTarget.cupoMaximo) {
            if (grupoTarget._count.inscripciones >= grupoTarget.cupoMaximo) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'El grupo seleccionado ah alcansado el limite de su capacidad maxima. Seleccione o cree otro grupo'
              });
            }
          }

          // Crear la inscripción académica
          const inscripcion = await tx.inscripcionCiclo.create({
            data: {
              alumno: { connect: { alumnoId: alumno.alumnoId } },
              ciclo: { connect: { cicloId: cicloActivo.cicloId } },
              grupo: { connect: { grupoId: grupoId } },
              grado: { connect: { gradoId: gradoId } },
              planPago: input.planPagoId ? { connect: { planPagoId: input.planPagoId } } : undefined,
              fechaIngreso: new Date(),
              estadoEnCiclo: 'INSCRITO',
              estadoFinanciero: input.planPagoId ? 'AL_CORRIENTE' : 'NO_APLICA',
            } as any
          });

          if (input.planPagoId) {
            const planPago = await tx.planPago.findUnique({ where: { planPagoId: input.planPagoId } });
            if (planPago && !planPago.eliminadoEn) {
              const tarifas = await tx.tarifa.findMany({
                where: {
                  cicloId: cicloActivo.cicloId,
                  nivelId: input.nivelId,
                  activa: true,
                  eliminadoEn: null
                }
              });
              const tarifasParaCalculadora = tarifas.map(t => ({ concepto: t.concepto, monto: Number(t.monto) }));
              const { CalculadoraPagos } = require('../inscripciones/inscripciones.utils');
              const planBase = { meses: planPago.meses };
              const configGlobal = await tx.configuracionGlobal.findFirst({ where: { configuracionId: 1 } });
              const diaVencimiento = configGlobal?.diaVencimientoMensual || 1;
              const adeudosCalculados = CalculadoraPagos.generarCalendario(planBase, tarifasParaCalculadora, new Date(inscripcion.fechaIngreso), diaVencimiento);
              const adeudosParaInsertar = adeudosCalculados.map((a: any) => ({
                alumnoId: alumno.alumnoId,
                cicloId: cicloActivo.cicloId,
                ...a
              }));
              await tx.calendarioPago.createMany({ data: adeudosParaInsertar as any });
            }
          }
        }
      }

      return alumno;
    });
  }

  /**
   * Actualiza la información del alumno (incluyendo bajas)
   */
  static async updateAlumno(input: UpdateAlumnoInput) {
    const { alumnoId, fechaNacimiento, fechaBaja, nivelId, gradoId, grupoId, ...data } = input;

    const existing = await AlumnosRepository.getAlumnoDetail(alumnoId);
    if (!existing || existing.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' });
    }

    const updateData: any = {
      ...data,
      ...(data.curp !== undefined && { curp: data.curp?.trim() || null }),
      ...(data.matricula !== undefined && { matricula: data.matricula?.trim() || null }),
      ...(fechaNacimiento && { fechaNacimiento: new Date(fechaNacimiento) }),
      ...(fechaBaja && { fechaBaja: new Date(fechaBaja) }),
      actualizadoEn: new Date()
    };

    if (nivelId !== undefined) {
      updateData.nivel = { connect: { nivelId } };
    }
    if (gradoId !== undefined) {
      updateData.grado = { connect: { gradoId } };
    }

    return prisma.$transaction(async (tx) => {
      // 1. Actualizar el alumno
      const alumno = await tx.alumno.update({
        where: { alumnoId },
        data: updateData
      });

      // 2. Determinar si hay un ciclo activo para el nivel y actualizar/crear inscripción
      const finalNivelId = nivelId !== undefined ? nivelId : existing.nivelId;
      if (!finalNivelId) return alumno;

      const nivel = await tx.nivelEducativo.findUnique({
        where: { nivelId: finalNivelId }
      });
      const periodicidad = nivel?.codigo === 'BAC' ? 'SEMESTRAL' : 'ANUAL';

      const cicloActivo = await tx.cicloEscolar.findFirst({
        where: { activo: true, eliminadoEn: null, periodicidad },
        orderBy: { fechaInicio: 'desc' }
      });

      if (cicloActivo && (gradoId !== undefined || grupoId !== undefined || nivelId !== undefined)) {
        const inscripcionActiva = await tx.inscripcionCiclo.findFirst({
          where: { alumnoId, estadoEnCiclo: 'INSCRITO', eliminadoEn: null }
        });

        const finalGradoId = gradoId !== undefined ? gradoId : existing.gradoId;
        const finalGrupoId = grupoId !== undefined ? grupoId : inscripcionActiva?.grupoId;

        if (finalGradoId && finalGrupoId) {
          // Validar capacidad del grupo si el alumno está entrando a un nuevo grupo
          if (grupoId !== undefined && (!inscripcionActiva || inscripcionActiva.grupoId !== finalGrupoId)) {
            const grupoTarget = await tx.grupo.findUnique({
              where: { grupoId: finalGrupoId },
              include: {
                _count: {
                  select: { inscripciones: { where: { estadoEnCiclo: 'INSCRITO', eliminadoEn: null } } }
                }
              }
            });

            if (grupoTarget && grupoTarget.cupoMaximo) {
              if (grupoTarget._count.inscripciones >= grupoTarget.cupoMaximo) {
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: 'El grupos seleccionado ah alcansado el limite de su capacidad maxima. Seleccione o cree otro grupo'
                });
              }
            }
          }

          if (inscripcionActiva) {
            await tx.inscripcionCiclo.update({
              where: { inscripcionId: inscripcionActiva.inscripcionId },
              data: {
                cicloId: cicloActivo.cicloId,
                gradoId: finalGradoId,
                grupoId: finalGrupoId,
                actualizadoEn: new Date()
              }
            });

            // Re-calcular los pagos pendientes o en abono con la nueva tarifa
            if (nivelId !== undefined || grupoId !== undefined || gradoId !== undefined) {
              const tarifa = await tx.tarifa.findFirst({
                where: {
                  cicloId: cicloActivo.cicloId,
                  nivelId: finalNivelId,
                  concepto: 'COLEGIATURA',
                  activa: true,
                  eliminadoEn: null
                }
              });
              
              const tarifaMensualBase = tarifa ? Number(tarifa.monto) : 0;

              const pagosPendientes = await tx.calendarioPago.findMany({
                where: {
                  alumnoId,
                  estadoCobro: { in: [EstadoCobro.PENDIENTE, EstadoCobro.VENCIDO] },
                  eliminadoEn: null
                }
              });

              for (const pago of pagosPendientes) {
                const nuevoMontoOriginal = tarifaMensualBase;
                const nuevoSaldoPendiente = Math.max(0, nuevoMontoOriginal - Number(pago.montoPagado || 0) + Number(pago.montoRecargo || 0));
                
                await tx.calendarioPago.update({
                  where: { calendarioPagoId: pago.calendarioPagoId },
                  data: {
                    cicloId: cicloActivo.cicloId,
                    montoOriginal: nuevoMontoOriginal,
                    saldoPendiente: nuevoSaldoPendiente,
                    estadoCobro: nuevoSaldoPendiente === 0 ? EstadoCobro.PAGADO : pago.estadoCobro,
                    actualizadoEn: new Date()
                  }
                });
              }
            }
          } else {
            await tx.inscripcionCiclo.create({
              data: {
                alumnoId,
                cicloId: cicloActivo.cicloId,
                gradoId: finalGradoId,
                grupoId: finalGrupoId,
                fechaIngreso: new Date(),
                estadoEnCiclo: 'INSCRITO',
                estadoFinanciero: 'NO_APLICA'
              } as any
            });
          }
        }
      }

      return alumno;
    });
  }

  /**
   * Soft Delete de un alumno
   */
  static async deleteAlumno(alumnoId: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Soft delete del alumno
      const alumno = await tx.alumno.update({
        where: { alumnoId },
        data: {
          eliminadoEn: new Date(),
          estado: 'BAJA_DEFINITIVA'
        }
      });

      // 2. Anular matrículas/inscripciones activas en este ciclo escolar
      await tx.inscripcionCiclo.updateMany({
        where: { alumnoId, eliminadoEn: null },
        data: {
          eliminadoEn: new Date(),
          estadoEnCiclo: 'ANULADA'
        }
      });

      // 3. Cancelar y realizar soft delete de los adeudos pendientes del calendario
      await tx.calendarioPago.updateMany({
        where: {
          alumnoId,
          estadoCobro: { in: ['PENDIENTE', 'VENCIDO'] },
          eliminadoEn: null
        },
        data: {
          estadoCobro: 'CANCELADO',
          eliminadoEn: new Date()
        }
      });

      return alumno;
    });
  }

  // --- Relación Alumno - Tutor ---

  /**
   * Vincula un tutor existente con un alumno
   */
  static async linkTutor(input: LinkTutorInput) {
    let finalEsPrincipal = input.esPrincipal;

    // Si no está forzado a true, verificamos si el alumno no tiene a nadie principal. Si no tiene a nadie, forzamos true.
    if (!finalEsPrincipal) {
      const tienePrincipal = await AlumnosRepository.hasTutorPrincipal(input.alumnoId);
      if (!tienePrincipal) {
        finalEsPrincipal = true;
      }
    }

    // Si este será el tutor principal, debemos quitarle la marca a los demás tutores de este alumno
    if (finalEsPrincipal) {
      await AlumnosRepository.removeTutorPrincipalFlag(input.alumnoId);
    }

    // Upsert para manejar el caso donde se reasigna la relación
    const existingRel = await AlumnosRepository.findTutorAlumnoRelation(input.tutorId, input.alumnoId);

    if (existingRel) {
      return AlumnosRepository.updateTutorAlumnoRelation(
        existingRel.tutorAlumnoId,
        Boolean(finalEsPrincipal),
        input.parentesco
      );
    }

    // Regla de negocio: Un alumno solo puede tener un tutor vinculado
    const tutorCount = await AlumnosRepository.getTutorCount(input.alumnoId);
    if (tutorCount >= 1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El alumno ya tiene un tutor vinculado. Solo se permite un tutor por alumno.'
      });
    }

    return AlumnosRepository.createTutorAlumnoRelation({
      ...input,
      esPrincipal: finalEsPrincipal
    });
  }

  /**
   * Desvincula a un tutor de un alumno
   */
  static async unlinkTutor(input: UnlinkTutorInput) {
    return AlumnosRepository.deleteTutorAlumnoRelation(input.tutorAlumnoId);
  }

  /**
   * Activa a un alumno que se encuentra en PREINSCRIPCION
   * Este método está diseñado para ser consumido por el módulo de pagos
   */
  static async activarAlumnoPorPago(alumnoId: number, _cicloId?: number) {
    const alumno = await prisma.alumno.findUnique({
      where: { alumnoId }
    });

    if (!alumno) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Alumno no encontrado' });
    }

    if (alumno.estado !== 'PREINSCRIPCION') {
      return { success: true, message: 'El alumno no requiere activación (no está en PREINSCRIPCION).' };
    }

    await prisma.alumno.update({
      where: { alumnoId },
      data: { estado: 'ACTIVO', actualizadoEn: new Date() }
    });

    return { success: true, message: 'Alumno activado correctamente tras registro de pago.' };
  }
}
