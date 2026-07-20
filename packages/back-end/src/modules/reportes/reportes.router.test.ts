// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '../../router';
import { prismaMock } from '../../../tests/setup/prisma-mock';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ usuarioId: 99, jti: 'test-jti' }))
  }
}));

describe('Reportes Router (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.logAuditoria.create.mockResolvedValue({} as any);
    prismaMock.usuarioPermisoModulo.findUnique.mockResolvedValue({
      activo: true,
      nivel: 'LECTURA_Y_ESCRITURA'
    } as any);
  });

  const ctxMock = {
    prisma: prismaMock as any,
    user: { usuarioId: 99, jti: 'test-jti' },
    req: {} as any,
    res: {} as any,
    token: 'fake-token'
  };

  const caller = appRouter.createCaller(ctxMock as any);

  describe('reporteDeudores', () => {
    it('debería retornar una lista plana de deudores con cálculos de atraso correctos', async () => {
      // Configuramos una fecha de vencimiento fija para predecir los días de atraso
      const hace10Dias = new Date();
      hace10Dias.setDate(hace10Dias.getDate() - 10);

      prismaMock.calendarioPago.findMany.mockResolvedValue([
        {
          alumno: {
            nombreCompleto: 'Alumno Test',
            matricula: 'MAT-001',
            tutoresAlumnos: [
              { tutor: { nombreCompleto: 'Tutor Test', telefono: '123456789' } }
            ]
          },
          ciclo: { nombre: '2023-2024' },
          concepto: 'Colegiatura Enero',
          mes: 'Enero',
          saldoPendiente: 1500,
          fechaVencimiento: hace10Dias
        }
      ] as any);

      const result = await caller.reportes.reporteDeudores();

      expect(prismaMock.calendarioPago.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { estadoCobro: 'VENCIDO' }
      }));
      expect(result.length).toBe(1);
      expect(result[0].alumno).toBe('Alumno Test');
      expect(result[0].tutorPrincipal).toBe('Tutor Test');
      expect(result[0].montoAdeudo).toBe(1500);
      expect(result[0].diasAtraso).toBeGreaterThanOrEqual(9);
      expect(result[0].diasAtraso).toBeLessThanOrEqual(11); // Evitamos inestabilidad por milisegundos
    });

    it('debería manejar casos donde el alumno no tiene tutor', async () => {
      prismaMock.calendarioPago.findMany.mockResolvedValue([
        {
          alumno: {
            nombreCompleto: 'Huerfano Test',
            matricula: 'MAT-002',
            tutoresAlumnos: []
          },
          ciclo: { nombre: '2023-2024' },
          concepto: 'Colegiatura',
          mes: 'Enero',
          saldoPendiente: 1000,
          fechaVencimiento: new Date()
        }
      ] as any);

      const result = await caller.reportes.reporteDeudores();
      
      expect(result[0].tutorPrincipal).toBe('Sin tutor');
      expect(result[0].telefonoTutor).toBe('N/A');
    });
  });

  describe('reporteIngresos', () => {
    it('debería extraer pagos entre el rango de fechas proporcionado', async () => {
      prismaMock.pago.findMany.mockResolvedValue([
        {
          pagoId: 5,
          fechaPago: new Date('2023-01-15T12:00:00Z'),
          alumno: { nombreCompleto: 'Alumno Pagador' },
          tutor: { nombreCompleto: 'Tutor Pagador' },
          metodoPago: 'DEPOSITO',
          montoTotal: 3000,
          registrador: { nombreCompleto: 'Cajero' }
        }
      ] as any);

      const result = await caller.reportes.reporteIngresos({
        fechaInicio: '2023-01-01T00:00:00Z',
        fechaFin: '2023-01-31T23:59:59Z'
      });

      expect(prismaMock.pago.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          fechaPago: {
            gte: new Date('2023-01-01T00:00:00Z'),
            lte: new Date('2023-01-31T23:59:59Z')
          }
        }
      }));

      expect(result.length).toBe(1);
      expect(result[0].pagoId).toBe(5);
      expect(result[0].montoTotal).toBe(3000);
      expect(result[0].cajero).toBe('Cajero');
    });
  });

  describe('listaAsistencia', () => {
    it('debería retornar el total de alumnos inscritos en el grupo y su registro de asistencia', async () => {
      prismaMock.inscripcionCiclo.findMany.mockResolvedValue([
        { alumno: { nombreCompleto: 'Juan Perez' } },
        { alumno: { nombreCompleto: 'Ana Garcia' } }
      ] as any);

      prismaMock.asistencia.findMany.mockResolvedValue([
        { fecha: new Date('2023-05-10'), estado: 'PRESENTE' }
      ] as any);

      const result = await caller.reportes.listaAsistencia({
        grupoId: 10,
        anio: 2023,
        mes: 5
      });

      expect(prismaMock.inscripcionCiclo.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { grupoId: 10, estadoEnCiclo: 'INSCRITO' }
      }));

      expect(result.totalAlumnos).toBe(2);
      expect(result.alumnos).toContain('Juan Perez');
      expect(result.registroDetallado.length).toBe(1);
    });
  });
});
