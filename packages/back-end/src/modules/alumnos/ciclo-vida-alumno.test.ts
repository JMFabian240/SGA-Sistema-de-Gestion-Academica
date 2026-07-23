import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { GruposService } from '../grupos/grupos.service';
import { PagosService } from '../pagos/pagos.service';
import { TutoresService } from '../tutores/tutores.service';
import { AlumnosService } from './alumnos.service';
import { InscripcionesService } from '../inscripciones/inscripciones.service';
import { EstadoAlumno } from '@prisma/client';

describe('Flujo de Integración: Ciclo de Vida del Alumno', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
  });

  it('debería ejecutar el flujo completo exitosamente: Crear Ciclo -> Tutor -> Alumno -> Inscribir -> Generar Adeudos -> Pagar', async () => {
    
    // 1. Crear Ciclo Escolar
    prismaMock.nivelEducativo.findMany.mockResolvedValue([]);
    prismaMock.grado.findMany.mockResolvedValue([]);
    prismaMock.cicloEscolar.create.mockResolvedValue({ cicloId: 10, nombre: '2025-2026', activo: true } as any);
    const ciclo = await GruposService.createCiclo({
      nombre: '2025-2026', periodicidad: 'ANUAL', fechaInicio: '2025-08-01', fechaFin: '2026-07-15'
    });
    expect(ciclo.cicloId).toBe(10);

    // 2. Crear Tarifa (Colegiatura Anual)
    prismaMock.tarifa.create.mockResolvedValue({ tarifaId: 20, monto: 24000 } as any);
    const tarifa = await PagosService.createTarifa({
      cicloId: 10, nivelId: 1, concepto: 'COLEGIATURA', monto: 24000
    });
    expect(tarifa.tarifaId).toBe(20);

    // 3. Crear Tutor
    prismaMock.tutor.findFirst.mockResolvedValue(null); // No existe
    prismaMock.tutor.create.mockResolvedValue({ tutorId: 30, saldoAFavor: 0 } as any);
    const tutor = await TutoresService.createTutor({
      nombreCompleto: 'Juan Padre',
      correoElectronico: 'padre@mail.com',
      telefonoPrincipal: '1234567890',
      rfc: 'PJUAN1234',
      direccion: 'Calle 1'
    });
    expect(tutor.tutorId).toBe(30);

    // 4. Crear Alumno
    prismaMock.alumno.findFirst.mockResolvedValue(null);
    prismaMock.alumno.create.mockResolvedValue({ alumnoId: 40, nivelId: 1 } as any);
    prismaMock.tutorAlumno.create.mockResolvedValue({} as any);
    const alumno = await AlumnosService.createAlumno({
      curp: 'CURP001',
      nombreCompleto: 'Juan Hijo',
      fechaNacimiento: '2015-01-01',
      sexo: 'M',
      nivelId: 1,
      estado: 'ACTIVO' as EstadoAlumno,
      tutorPrincipalId: 30,
      parentesco: 'Padre'
    });
    expect(alumno.alumnoId).toBe(40);

    // 5. Inscribir Alumno y Asignar Plan (12 Meses)
    prismaMock.inscripcionCiclo.findUnique.mockResolvedValue(null); // No existe para createInscripcion
    prismaMock.calificacion.findFirst.mockResolvedValue(null); // Sin reprobadas
    prismaMock.inscripcionCiclo.create.mockResolvedValue({ inscripcionId: 50, alumnoId: 40, cicloId: 10, fechaIngreso: new Date('2025-08-01'), alumno: { nivelId: 1 } } as any);
    
    await InscripcionesService.createInscripcion({
      alumnoId: 40, cicloId: 10, fechaIngreso: '2025-08-01', esIngresoTardio: false, estadoEnCiclo: 'ACTIVO', estadoFinanciero: 'NO_APLICA'
    });

    // Cambiar el mock para asignarPlanPago
    prismaMock.inscripcionCiclo.findUnique.mockResolvedValue({ 
      inscripcionId: 50, cicloId: 10, alumnoId: 40, fechaIngreso: new Date('2025-08-01'), alumno: { nivelId: 1 }
    } as any);
    prismaMock.planPago.findUnique.mockResolvedValue({ planPagoId: 99, meses: 12 } as any);
    prismaMock.tarifa.findMany.mockResolvedValue([{ tarifaId: 20, concepto: 'COLEGIATURA', monto: 24000 }] as any);
    prismaMock.calendarioPago.createMany.mockResolvedValue({ count: 12 } as any);
    prismaMock.inscripcionCiclo.update.mockResolvedValue({} as any);

    await InscripcionesService.asignarPlanPago({ inscripcionId: 50, planPagoId: 99 });
    
    expect(prismaMock.calendarioPago.createMany).toHaveBeenCalled(); // 12 recibos

    // 6. Registrar Pago
    const mockAdeudo = { calendarioPagoId: 100, montoOriginal: 1000, saldoPendiente: 1000, estadoCobro: 'PENDIENTE' };
    prismaMock.pago.create.mockResolvedValue({ pagoId: 200 } as any);
    prismaMock.calendarioPago.findUnique.mockResolvedValue(mockAdeudo as any);
    prismaMock.calendarioPago.findMany.mockResolvedValue([mockAdeudo] as any);
    prismaMock.aplicacionPago.create.mockResolvedValue({} as any);
    prismaMock.calendarioPago.update.mockResolvedValue({} as any);
    prismaMock.tutor.update.mockResolvedValue({} as any); // Por si se llama saldo a favor

    await PagosService.registrarPago({
      alumnoId: 40, tutorId: 30, fechaPago: '2025-08-05', montoTotal: 1000, metodoPago: 'TRANSFERENCIA', requiereFactura: false, aplicadoASaldo: false,
      aplicaciones: [{ calendarioPagoId: 100, montoAplicado: 1000, aplicadoA: 'CAPITAL' }]
    }, 999);

    expect(prismaMock.pago.create).toHaveBeenCalled();
    expect(prismaMock.aplicacionPago.create).toHaveBeenCalled();
    expect(prismaMock.calendarioPago.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { calendarioPagoId: 100 },
      data: expect.objectContaining({ estadoCobro: 'PAGADO', saldoPendiente: 0 })
    }));

    // Verifica que todo el flujo corrió sin arrojar excepciones de integración.
  });
});