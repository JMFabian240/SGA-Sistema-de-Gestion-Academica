// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '../../router';
import { prismaMock } from '../../../tests/setup/prisma-mock';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ usuarioId: 99, jti: 'test-jti' }))
  }
}));

describe('Dashboard Router (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ctxMock = {
    prisma: prismaMock as any,
    user: { usuarioId: 99, jti: 'test-jti' },
    req: {} as any,
    res: {} as any,
    token: 'fake-token'
  };

  const caller = appRouter.createCaller(ctxMock as any);

  describe('obtenerMetricasInscripcion', () => {
    it('debería calcular el total de alumnos activos, en baja y capacidad total', async () => {
      // Mock para alumnosActivos
      prismaMock.alumno.count.mockResolvedValueOnce(200);
      
      // Mock para alumnosBaja
      prismaMock.alumno.count.mockResolvedValueOnce(15);
      
      // Mock para cuposPorNivel (agregación)
      prismaMock.grupo.groupBy.mockResolvedValue([
        { nivelId: 1, _sum: { cupoMaximo: 100 } },
        { nivelId: 2, _sum: { cupoMaximo: 150 } },
        { nivelId: 3, _sum: { cupoMaximo: null } } // Simula un caso sin cupo asignado
      ] as any);

      const result = await caller.dashboard.obtenerMetricasInscripcion();

      expect(prismaMock.alumno.count).toHaveBeenCalledTimes(2);
      expect(prismaMock.grupo.groupBy).toHaveBeenCalledWith({
        by: ['nivelId'],
        _sum: { cupoMaximo: true }
      });

      expect(result.alumnosActivos).toBe(200);
      expect(result.alumnosBaja).toBe(15);
      // La suma de 100 + 150 + 0
      expect(result.cuposTotales).toBe(250);
      expect(result.detallesNivel.length).toBe(3);
    });
  });

  describe('obtenerKpisFinancieros', () => {
    it('debería calcular los ingresos del mes y la deuda pendiente', async () => {
      // Mock para ingresos
      prismaMock.pago.aggregate.mockResolvedValue({
        _sum: { montoTotal: 55000 }
      } as any);

      // Mock para deuda pendiente
      prismaMock.calendarioPago.aggregate.mockResolvedValue({
        _sum: { saldoPendiente: 12500 }
      } as any);

      const result = await caller.dashboard.obtenerKpisFinancieros();

      expect(prismaMock.pago.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        _sum: { montoTotal: true },
        where: expect.objectContaining({ fechaPago: expect.any(Object) })
      }));

      expect(prismaMock.calendarioPago.aggregate).toHaveBeenCalledWith({
        _sum: { saldoPendiente: true },
        where: { estadoCobro: { in: ['PENDIENTE', 'VENCIDO'] } }
      });

      expect(result.ingresosMesActual).toBe(55000);
      expect(result.deudaPendienteTotal).toBe(12500);
    });

    it('debería retornar 0 si no hay ingresos ni deuda', async () => {
      prismaMock.pago.aggregate.mockResolvedValue({
        _sum: { montoTotal: null }
      } as any);

      prismaMock.calendarioPago.aggregate.mockResolvedValue({
        _sum: { saldoPendiente: null }
      } as any);

      const result = await caller.dashboard.obtenerKpisFinancieros();

      expect(result.ingresosMesActual).toBe(0);
      expect(result.deudaPendienteTotal).toBe(0);
    });
  });

  describe('obtenerIngresosUltimos7Dias', () => {
    it('debería retornar un listado de los últimos 7 días con los ingresos sumados', async () => {
      const hoyLocal = new Date();
      const hoyUTC = new Date(Date.UTC(hoyLocal.getFullYear(), hoyLocal.getMonth(), hoyLocal.getDate()));

      const hace2DiasLocal = new Date();
      hace2DiasLocal.setDate(hace2DiasLocal.getDate() - 2);
      const hace2DiasUTC = new Date(Date.UTC(hace2DiasLocal.getFullYear(), hace2DiasLocal.getMonth(), hace2DiasLocal.getDate()));

      prismaMock.pago.findMany.mockResolvedValue([
        { fechaPago: hoyUTC, montoTotal: 1000 },
        { fechaPago: hoyUTC, montoTotal: 500 },
        { fechaPago: hace2DiasUTC, montoTotal: 2500 }
      ] as any);

      const result = await caller.dashboard.obtenerIngresosUltimos7Dias();

      expect(prismaMock.pago.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(7);

      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const diaHoy = diasSemana[hoyLocal.getDay()];
      const diaHace2Dias = diasSemana[hace2DiasLocal.getDay()];

      expect(result[6].day).toBe(diaHoy);
      expect(result[6].ingresos).toBe(1500); // 1000 + 500

      expect(result[4].day).toBe(diaHace2Dias);
      expect(result[4].ingresos).toBe(2500);
    });
  });
});
