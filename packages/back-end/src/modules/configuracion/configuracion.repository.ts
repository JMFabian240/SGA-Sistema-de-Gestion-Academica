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
}
