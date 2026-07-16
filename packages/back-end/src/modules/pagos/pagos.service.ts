import { TRPCError } from '@trpc/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@sga/data-access';
import type {
  CreateTarifaInput, UpdateTarifaInput,
  CreateCalendarioPagoInput, UpdateCalendarioPagoInput,
  RegistrarPagoInput, CreateCargoExtraordinarioInput,
  AdjuntarComprobanteInput
} from './pagos.schema';
import { PagosRepository } from './pagos.repository';

export class PagosService {

  // --- Tarifas ---
  static async getTarifas(cicloId?: number, nivelId?: number) {
    return PagosRepository.getTarifas(cicloId, nivelId);
  }

  static async createTarifa(input: CreateTarifaInput) {
    const data: any = { ...input };
    if (input.fechaVencimiento) {
      data.fechaVencimiento = new Date(input.fechaVencimiento);
    } else {
      data.fechaVencimiento = null;
    }
    return PagosRepository.createTarifa(data);
  }

  static async updateTarifa(input: UpdateTarifaInput) {
    const { tarifaId, fechaVencimiento, ...data } = input;
    const updateData: any = { ...data, actualizadoEn: new Date() };
    if (fechaVencimiento !== undefined) {
      updateData.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    }
    return PagosRepository.updateTarifa(tarifaId, updateData);
  }

  static async deleteTarifa(tarifaId: number) {
    return PagosRepository.deleteTarifa(tarifaId);
  }

  // --- Calendario de Pagos (Adeudos) ---
  static calcularEstadoAbono(adeudo: any) {
    if (adeudo.estadoCobro === 'PENDIENTE' && Number(adeudo.montoPagado) > 0 && Number(adeudo.saldoPendiente) > 0) {
      return { ...adeudo, estadoCobro: 'ABONO' };
    }
    return adeudo;
  }

  static async getAdeudosAlumno(alumnoId: number, estadoCobro?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO' | 'ABONO') {
    const adeudos = await PagosRepository.getAdeudosAlumno(alumnoId, estadoCobro as any);
    return adeudos.map(this.calcularEstadoAbono);
  }

  static async createAdeudo(input: CreateCalendarioPagoInput) {
    let estado = input.saldoPendiente <= 0 ? 'PAGADO' : 'PENDIENTE';
    if (input.montoPagado && input.montoPagado > 0 && input.saldoPendiente > 0) estado = 'ABONO';
    
    return PagosRepository.createAdeudo({
      ...input,
      fechaVencimiento: new Date(input.fechaVencimiento),
      estadoCobro: estado as any
    });
  }

  static async updateAdeudo(input: UpdateCalendarioPagoInput) {
    const { calendarioPagoId, fechaVencimiento, ...data } = input;
    return PagosRepository.updateAdeudo(calendarioPagoId, {
      ...data,
      ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }),
      actualizadoEn: new Date()
    });
  }

  static async recalcularCalendario(alumnoId: number, usuarioId: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Encontrar inscripción activa
      const inscripcion = await tx.inscripcionCiclo.findFirst({
        where: { alumnoId, estadoEnCiclo: 'INSCRITO', eliminadoEn: null, ciclo: { activo: true } },
        include: { ciclo: true, alumno: true }
      });
      if (!inscripcion) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'El alumno no tiene inscripción activa en un ciclo activo.' });
      }

      // 2. Obtener todas las tarifas activas
      const tarifas = await tx.tarifa.findMany({
        where: {
          cicloId: inscripcion.cicloId,
          nivelId: inscripcion.alumno.nivelId,
          activa: true,
          eliminadoEn: null
        }
      });
      if (tarifas.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No hay tarifas activas para este nivel y ciclo.' });
      }

      const planPago = await tx.planPago.findUnique({ where: { planPagoId: inscripcion.planPagoId! } });
      if (!planPago) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'El alumno no tiene un plan de pagos válido.' });
      }

      const { CalculadoraPagos } = require('../inscripciones/inscripciones.utils');
      const tarifasParaCalculadora = tarifas.map(t => ({ concepto: t.concepto, monto: Number(t.monto) }));
      const adeudosIdeales = CalculadoraPagos.generarCalendario(
        { meses: planPago.meses },
        tarifasParaCalculadora,
        new Date(inscripcion.fechaIngreso)
      );

      // 3. Obtener TODOS los adeudos PENDIENTE o ABONO para el ciclo actual (cualquier concepto)
      const adeudos = await tx.calendarioPago.findMany({
        where: {
          alumnoId,
          cicloId: inscripcion.cicloId,
          estadoCobro: { in: ['PENDIENTE', 'ABONO'] },
          eliminadoEn: null
        },
        orderBy: { fechaVencimiento: 'asc' },
        include: {
          aplicacionesPago: {
            orderBy: { creadoEn: 'asc' }
          }
        }
      });

      interface AppPoolItem {
        pagoId: number;
        montoAplicado: number;
        aplicadoA: string;
      }
      let appPool: AppPoolItem[] = [];

      for (const adeudo of adeudos) {
        // Buscar cuál debería ser el monto actual según la calculadora
        const ideal = adeudosIdeales.find((a: any) => a.concepto === adeudo.concepto);
        if (!ideal) continue; // Si no hay ideal, no se recalcula

        const nuevaTarifa = ideal.montoOriginal;

        for (const app of adeudo.aplicacionesPago) {
          appPool.push({
             pagoId: app.pagoId,
             montoAplicado: Number(app.montoAplicado),
             aplicadoA: app.aplicadoA
          });
        }

        if (adeudo.aplicacionesPago.length > 0) {
          await tx.aplicacionPago.deleteMany({
            where: { calendarioPagoId: adeudo.calendarioPagoId }
          });
        }

        let montoParaEsteAdeudo = 0;
        let nuevasApps = [];
        let nuevoPool: AppPoolItem[] = [];

        for (const app of appPool) {
          const faltaParaLlenar = nuevaTarifa - montoParaEsteAdeudo;
          if (faltaParaLlenar > 0) {
            if (app.montoAplicado <= faltaParaLlenar) {
              nuevasApps.push({ ...app });
              montoParaEsteAdeudo += app.montoAplicado;
            } else {
              nuevasApps.push({
                pagoId: app.pagoId,
                montoAplicado: faltaParaLlenar,
                aplicadoA: app.aplicadoA
              });
              montoParaEsteAdeudo += faltaParaLlenar;
              nuevoPool.push({
                pagoId: app.pagoId,
                montoAplicado: app.montoAplicado - faltaParaLlenar,
                aplicadoA: app.aplicadoA
              });
            }
          } else {
            nuevoPool.push(app);
          }
        }

        appPool = nuevoPool;

        for (const nuevaApp of nuevasApps) {
          await tx.aplicacionPago.create({
            data: {
              pagoId: nuevaApp.pagoId,
              calendarioPagoId: adeudo.calendarioPagoId,
              montoAplicado: nuevaApp.montoAplicado,
              aplicadoA: nuevaApp.aplicadoA
            }
          });
        }

        const saldoPendiente = Math.round((nuevaTarifa - montoParaEsteAdeudo) * 100) / 100;
        let estadoCobro = saldoPendiente <= 0 ? 'PAGADO' : 'PENDIENTE';
        if (montoParaEsteAdeudo > 0 && saldoPendiente > 0) estadoCobro = 'ABONO';
        
        await tx.calendarioPago.update({
          where: { calendarioPagoId: adeudo.calendarioPagoId },
          data: {
            montoOriginal: nuevaTarifa,
            montoPagado: montoParaEsteAdeudo,
            saldoPendiente: saldoPendiente,
            estadoCobro: estadoCobro as any,
            liquidadoAt: estadoCobro === 'PAGADO' ? new Date() : null,
            actualizadoEn: new Date()
          }
        });
      }

      // Si sobra dinero al final, va al saldo a favor
      if (appPool.length > 0) {
        let saldoAFavorExtra = appPool.reduce((acc, curr) => acc + curr.montoAplicado, 0);
        const alumno = await tx.alumno.findUnique({ 
          where: { alumnoId }, 
          include: { tutoresAlumnos: { where: { esPrincipal: true } } } 
        });
        const tutorId = alumno?.tutoresAlumnos?.[0]?.tutorId;
        
        if (tutorId) {
          await tx.tutor.update({
            where: { tutorId },
            data: { saldoAFavor: { increment: saldoAFavorExtra } }
          });
          
          for (const app of appPool) {
             await tx.movimientoSaldo.create({
               data: {
                 tutorId,
                 pagoId: app.pagoId,
                 tipo: 'INGRESO',
                 monto: app.montoAplicado,
                 descripcion: 'Saldo a favor generado por recálculo de tarifas (reducción).',
                 creadoPor: usuarioId
               }
             });
          }
        }
      }

      return { success: true, message: 'Calendario recalculado exitosamente' };
    });
  }


  static async createCargoExtraordinario(input: CreateCargoExtraordinarioInput) {
    return PagosRepository.createAdeudo({
      alumnoId: input.alumnoId,
      cicloId: input.cicloId,
      concepto: input.concepto,
      mes: null, // Los cargos extra no están ligados a un mes específico
      fechaVencimiento: new Date(input.fechaVencimiento),
      montoOriginal: input.monto,
      saldoPendiente: input.monto,
      estadoCobro: 'PENDIENTE'
    });
  }

  static async registrarPago(input: RegistrarPagoInput, registradorId: number) {
    // Calcular suma de aplicaciones para validar contra el monto total
    const totalAplicado = input.aplicaciones.reduce((acc, app) => acc + app.montoAplicado, 0);

    // Buscar todos los adeudos pendientes del alumno para aplicar excedentes si los hay
    let surplus = input.montoTotal - totalAplicado;
    
    if (surplus < 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El monto total del pago es menor que la suma de las aplicaciones indicadas.'
      });
    }

    if (surplus > 0) {
      // Buscar adeudos pendientes ordenados por fecha
      const pendientes = await prisma.calendarioPago.findMany({
        where: {
          alumnoId: input.alumnoId,
          eliminadoEn: null,
          estadoCobro: 'PENDIENTE'
        },
        orderBy: { fechaVencimiento: 'asc' }
      });

      for (const adeudo of pendientes) {
        if (surplus <= 0) break;

        // Verificar si ya viene en las aplicaciones explícitas y cuánto se le aplicó
        const appImplicita = input.aplicaciones.find(a => a.calendarioPagoId === adeudo.calendarioPagoId);
        const yaAplicado = appImplicita ? appImplicita.montoAplicado : 0;
        
        // Cuánto le falta por pagar a este adeudo
        const faltaPorPagar = Number(adeudo.saldoPendiente) - yaAplicado;

        if (faltaPorPagar > 0) {
          const aplicarAhora = Math.min(surplus, faltaPorPagar);
          
          if (appImplicita) {
            appImplicita.montoAplicado += aplicarAhora;
          } else {
            input.aplicaciones.push({
              calendarioPagoId: adeudo.calendarioPagoId,
              montoAplicado: aplicarAhora,
              aplicadoA: 'CAPITAL' // Concepto por defecto para excedentes automáticos
            });
          }
          surplus -= aplicarAhora;
        }
      }

      // Si aún sobra dinero después de cubrir todos los adeudos
      if (surplus > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El pago excede el total de todas las deudas pendientes del alumno.'
        });
      }
    }

    // Por regla de negocio impuesta, el saldo a favor generado será siempre 0
    const saldoAFavorGenerado = 0;

    // Delegar transacción al repositorio
    const resultadoPago = await PagosRepository.registrarPagoTransaccion({
      pagoData: {
        alumnoId: input.alumnoId,
        tutorId: input.tutorId,
        fechaPago: new Date(input.fechaPago),
        montoTotal: input.montoTotal,
        metodoPago: input.metodoPago,
        aplicadoASaldo: input.aplicadoASaldo,
        // @ts-ignore - requiereFactura existe en el esquema Prisma, el cliente podría requerir re-generación
        requiereFactura: input.requiereFactura,
        observaciones: input.observaciones,
        registradoPor: registradorId
      },
      aplicaciones: input.aplicaciones,
      saldoAFavorGenerado,
      tutorId: input.tutorId,
      registradorId
    });

    // Si viene comprobante adjunto
    if (input.comprobanteBase64 && input.comprobanteNombre && input.comprobanteMime) {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'comprobantes');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Limpiar el base64 si trae prefijo 'data:image/jpeg;base64,'
        const base64Data = input.comprobanteBase64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${Date.now()}-${input.comprobanteNombre}`;
        const rutaCompleta = path.join(uploadsDir, filename);

        fs.writeFileSync(rutaCompleta, buffer);

        // Guardar el registro Documento en BD
        await prisma.documento.create({
          data: {
            tipoDocumento: 'COMPROBANTE_PAGO',
            nombreOriginal: input.comprobanteNombre,
            rutaAlmacen: `uploads/comprobantes/${filename}`,
            mimeType: input.comprobanteMime,
            tamanoBytes: buffer.length,
            pagoId: resultadoPago.pagoId,
            alumnoId: input.alumnoId,
            subidoPor: registradorId
          }
        });
      } catch (error) {
        console.error('Error al guardar el comprobante adjunto:', error);
        // Podríamos fallar o dejarlo pasar. Siendo opcional, lo registramos como error sin tirar la tx.
      }
    }

    return resultadoPago;
  }

  static async getReciboPago(pagoId: number) {
    const pago = await PagosRepository.getReciboPago(pagoId);
    if (!pago) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Recibo de pago no encontrado.'
      });
    }
    return pago;
  }

  static async adjuntarComprobante(input: AdjuntarComprobanteInput, subidoPorId: number) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'comprobantes');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const base64Data = input.comprobanteBase64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${Date.now()}-${input.comprobanteNombre}`;
      const rutaCompleta = path.join(uploadsDir, filename);

      fs.writeFileSync(rutaCompleta, buffer);

      const documento = await prisma.documento.create({
        data: {
          tipoDocumento: 'COMPROBANTE_PAGO',
          nombreOriginal: input.comprobanteNombre,
          rutaAlmacen: `uploads/comprobantes/${filename}`,
          mimeType: input.comprobanteMime,
          tamanoBytes: buffer.length,
          pagoId: input.pagoId,
          alumnoId: input.alumnoId,
          subidoPor: subidoPorId
        }
      });
      return { success: true, documentoId: documento.documentoId };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No se pudo guardar el comprobante.'
      });
    }
  }

  static async getComprobanteBase64(pagoId: number) {
    const documento = await prisma.documento.findFirst({
      where: { pagoId, tipoDocumento: 'COMPROBANTE_PAGO' },
      orderBy: { documentoId: 'desc' }
    });

    if (!documento) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No hay comprobante asociado.' });
    }

    try {
      const rutaCompleta = path.join(process.cwd(), documento.rutaAlmacen);
      const buffer = fs.readFileSync(rutaCompleta);
      const base64 = buffer.toString('base64');
      return {
        base64: `data:${documento.mimeType};base64,${base64}`,
        nombre: documento.nombreOriginal,
        mime: documento.mimeType
      };
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo leer el archivo físico.' });
    }
  }
}
