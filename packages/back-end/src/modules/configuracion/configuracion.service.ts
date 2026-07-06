import { TRPCError } from '@trpc/server';
import { type UpdateConfigInput } from './configuracion.schema';
import { ConfiguracionRepository } from './configuracion.repository';

export class ConfiguracionService {
  // Siempre asumiremos que la configuración global tiene el ID 1 (Single Row)
  private static CONFIG_ID = 1;

  /**
   * Obtiene la configuración global actual
   */
  static async getConfiguracion() {
    let config = await ConfiguracionRepository.findConfiguracion(this.CONFIG_ID);

    if (!config) {
      // Si no existe, creamos una por defecto
      config = await ConfiguracionRepository.createConfiguracion({
        configuracionId: this.CONFIG_ID,
        montoRecargoDefecto: 400.00,
        diasGraciaRecargo: 5,
        plazoInscripcionDias: 60,
        umbralesSmtpDias: [5, 3, 1] // Umbrales por defecto en la DB (JSON)
      });
    }

    return {
      configuracionId: config.configuracionId,
      montoRecargoDefecto: Number(config.montoRecargoDefecto),
      diasGraciaRecargo: config.diasGraciaRecargo,
      plazoInscripcionDias: config.plazoInscripcionDias,
      umbralesSmtpDias: config.umbralesSmtpDias as number[],
      actualizadoEn: config.actualizadoEn
    };
  }

  /**
   * Actualiza la configuración global
   */
  static async updateConfiguracion(input: UpdateConfigInput) {
    // Asegurarse de que exista primero
    await this.getConfiguracion();

    try {
      const updatedConfig = await ConfiguracionRepository.updateConfiguracion(this.CONFIG_ID, {
        montoRecargoDefecto: input.montoRecargoDefecto !== undefined ? input.montoRecargoDefecto : undefined,
        diasGraciaRecargo: input.diasGraciaRecargo,
        plazoInscripcionDias: input.plazoInscripcionDias,
        umbralesSmtpDias: input.umbralesSmtpDias ? input.umbralesSmtpDias : undefined,
        actualizadoEn: new Date()
      });

      return {
        configuracionId: updatedConfig.configuracionId,
        montoRecargoDefecto: Number(updatedConfig.montoRecargoDefecto),
        diasGraciaRecargo: updatedConfig.diasGraciaRecargo,
        plazoInscripcionDias: updatedConfig.plazoInscripcionDias,
        umbralesSmtpDias: updatedConfig.umbralesSmtpDias as number[],
        actualizadoEn: updatedConfig.actualizadoEn
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al actualizar la configuración global'
      });
    }
  }
}
