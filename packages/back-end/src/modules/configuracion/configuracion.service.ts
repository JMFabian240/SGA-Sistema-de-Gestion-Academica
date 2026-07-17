import { TRPCError } from '@trpc/server';
import { type UpdateConfigInput, type CreateConfiguracionRecargoInput, type UpdateConfiguracionRecargoInput } from './configuracion.schema';
import { ConfiguracionRepository } from './configuracion.repository';

export class ConfiguracionService {
  private static CONFIG_ID = 1;

  static async getConfiguracion() {
    let config = await ConfiguracionRepository.findConfiguracion(this.CONFIG_ID);

    if (!config) {
      config = await ConfiguracionRepository.createConfiguracion({
        configuracionId: this.CONFIG_ID,
        plazoInscripcionDias: 60,
        umbralesSmtpDias: [5, 3, 1],
        diaVencimientoMensual: 1,
        montoRecargoDefecto: 400,
        diasGraciaRecargo: 5
      });
    }

    return {
      configuracionId: config.configuracionId,
      diaVencimientoMensual: config.diaVencimientoMensual,
      plazoInscripcionDias: config.plazoInscripcionDias,
      umbralesSmtpDias: config.umbralesSmtpDias as number[],
      montoRecargoDefecto: Number(config.montoRecargoDefecto),
      diasGraciaRecargo: config.diasGraciaRecargo,
      actualizadoEn: config.actualizadoEn
    };
  }

  static async updateConfiguracion(input: UpdateConfigInput) {
    await this.getConfiguracion();

    try {
      const updatedConfig = await ConfiguracionRepository.updateConfiguracion(this.CONFIG_ID, {
        ...(input.diaVencimientoMensual !== undefined && { diaVencimientoMensual: input.diaVencimientoMensual }),
        plazoInscripcionDias: input.plazoInscripcionDias,
        umbralesSmtpDias: input.umbralesSmtpDias ? input.umbralesSmtpDias : undefined,
        actualizadoEn: new Date(),
        ...(input.montoRecargoDefecto !== undefined && { montoRecargoDefecto: input.montoRecargoDefecto }),
        ...(input.diasGraciaRecargo !== undefined && { diasGraciaRecargo: input.diasGraciaRecargo })
      });

      return {
        configuracionId: updatedConfig.configuracionId,
        diaVencimientoMensual: updatedConfig.diaVencimientoMensual,
        plazoInscripcionDias: updatedConfig.plazoInscripcionDias,
        umbralesSmtpDias: updatedConfig.umbralesSmtpDias as number[],
        montoRecargoDefecto: Number(updatedConfig.montoRecargoDefecto),
        diasGraciaRecargo: updatedConfig.diasGraciaRecargo,
        actualizadoEn: updatedConfig.actualizadoEn
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al actualizar la configuración global'
      });
    }
  }

  // --- Recargos ---
  static async getRecargos() {
    try {
      const recargos = await ConfiguracionRepository.getRecargos();
      return recargos.map((r: any) => ({
        ...r,
        monto: Number(r.monto)
      }));
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener configuraciones de recargos'
      });
    }
  }

  static async createRecargo(input: CreateConfiguracionRecargoInput) {
    try {
      const nuevo = await ConfiguracionRepository.createRecargo({
        conceptoPago: input.conceptoPago,
        monto: input.monto,
        diasGracia: input.diasGracia,
        activo: true
      });
      return { ...nuevo, monto: Number(nuevo.monto) };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al crear configuración de recargo'
      });
    }
  }

  static async updateRecargo(input: UpdateConfiguracionRecargoInput) {
    try {
      const data: any = { actualizadoEn: new Date() };
      if (input.monto !== undefined) data.monto = input.monto;
      if (input.diasGracia !== undefined) data.diasGracia = input.diasGracia;
      if (input.activo !== undefined) data.activo = input.activo;

      const actualizado = await ConfiguracionRepository.updateRecargo(input.id, data);
      return { ...actualizado, monto: Number(actualizado.monto) };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al actualizar configuración de recargo'
      });
    }
  }
}
