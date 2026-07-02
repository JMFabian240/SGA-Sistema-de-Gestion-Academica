import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfiguracionService } from './configuracion.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';

describe('ConfiguracionService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Obtención de Configuración', () => {
    it('debería retornar la configuración si ya existe', async () => {
      prismaMock.configuracionGlobal.findUnique.mockResolvedValue({
        configuracionId: 1,
        montoRecargoDefecto: 500,
        diasGraciaRecargo: 10,
        plazoInscripcionDias: 30,
        umbralesSmtpDias: [5, 2],
        actualizadoEn: new Date()
      } as any);

      const result = await ConfiguracionService.getConfiguracion();
      
      expect(result.montoRecargoDefecto).toBe(500);
      expect(result.diasGraciaRecargo).toBe(10);
      expect(prismaMock.configuracionGlobal.create).not.toHaveBeenCalled();
    });

    it('debería crear y retornar configuración por defecto si no existe', async () => {
      prismaMock.configuracionGlobal.findUnique.mockResolvedValue(null);
      prismaMock.configuracionGlobal.create.mockResolvedValue({
        configuracionId: 1,
        montoRecargoDefecto: 400,
        diasGraciaRecargo: 5,
        plazoInscripcionDias: 60,
        umbralesSmtpDias: [5, 3, 1],
        actualizadoEn: new Date()
      } as any);

      const result = await ConfiguracionService.getConfiguracion();

      expect(prismaMock.configuracionGlobal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configuracionId: 1,
          montoRecargoDefecto: 400,
          diasGraciaRecargo: 5
        })
      });
      expect(result.montoRecargoDefecto).toBe(400);
    });
  });

  describe('Actualización de Configuración', () => {
    it('debería actualizar los valores enviados', async () => {
      // Para el getConfiguracion() interno
      prismaMock.configuracionGlobal.findUnique.mockResolvedValue({
        configuracionId: 1
      } as any);
      
      prismaMock.configuracionGlobal.update.mockResolvedValue({
        configuracionId: 1,
        montoRecargoDefecto: 800,
        diasGraciaRecargo: 3,
        plazoInscripcionDias: 30,
        umbralesSmtpDias: [7, 3, 1],
        actualizadoEn: new Date()
      } as any);

      const result = await ConfiguracionService.updateConfiguracion({
        montoRecargoDefecto: 800,
        diasGraciaRecargo: 3,
        umbralesSmtpDias: [7, 3, 1]
      });

      expect(prismaMock.configuracionGlobal.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { configuracionId: 1 },
        data: expect.objectContaining({
          montoRecargoDefecto: 800,
          diasGraciaRecargo: 3,
          umbralesSmtpDias: [7, 3, 1],
          actualizadoEn: expect.any(Date)
        })
      }));
      
      expect(result.montoRecargoDefecto).toBe(800);
    });

    it('debería lanzar error INTERNAL_SERVER_ERROR si prisma falla', async () => {
      prismaMock.configuracionGlobal.findUnique.mockResolvedValue({ configuracionId: 1 } as any);
      prismaMock.configuracionGlobal.update.mockRejectedValue(new Error('DB Error'));

      await expect(ConfiguracionService.updateConfiguracion({ diasGraciaRecargo: 10 }))
        .rejects.toThrowError(new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al actualizar la configuración global' }));
    });
  });
});
