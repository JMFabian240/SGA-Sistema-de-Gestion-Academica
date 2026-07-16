import { prisma, Prisma } from '@sga/data-access';

export class ConfiguracionRepository {
  static async findConfiguracion(configId: number) {
    return prisma.configuracionGlobal.findUnique({
      where: { configuracionId: configId }
    });
  }

  static async createConfiguracion(data: Prisma.ConfiguracionGlobalCreateInput) {
    return prisma.configuracionGlobal.create({ data });
  }

  static async updateConfiguracion(configId: number, data: Prisma.ConfiguracionGlobalUpdateInput) {
    return prisma.configuracionGlobal.update({
      where: { configuracionId: configId },
      data
    });
  }

  // --- Recargos ---
  static async getRecargos() {
    return prisma.configuracionRecargo.findMany({
      where: { activo: true },
      orderBy: { creadoEn: 'desc' }
    });
  }

  static async createRecargo(data: Prisma.ConfiguracionRecargoCreateInput) {
    return prisma.configuracionRecargo.create({ data });
  }

  static async updateRecargo(id: number, data: Prisma.ConfiguracionRecargoUpdateInput) {
    return prisma.configuracionRecargo.update({
      where: { id },
      data
    });
  }
}
