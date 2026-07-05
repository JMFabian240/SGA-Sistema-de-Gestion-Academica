import { AuditoriaRepository } from './auditoria.repository';
import type { Prisma } from '@sga/data-access';
import type { ObtenerLogsInput } from './auditoria.schemas';

export class AuditoriaService {
  static async obtenerLogs(input: ObtenerLogsInput) {
    const skip = (input.pagina - 1) * input.limite;

    const whereClause: Prisma.LogAuditoriaWhereInput = {};
    
    if (input.usuarioId) {
      whereClause.usuarioId = input.usuarioId;
    }
    if (input.tablaAfectada) {
      whereClause.tablaAfectada = input.tablaAfectada;
    }
    if (input.accion) {
      whereClause.accion = input.accion;
    }
    if (input.fechaInicio || input.fechaFin) {
      whereClause.fechaHora = {};
      if (input.fechaInicio) whereClause.fechaHora.gte = new Date(input.fechaInicio);
      if (input.fechaFin) whereClause.fechaHora.lte = new Date(input.fechaFin);
    }

    const [total, logs] = await Promise.all([
      AuditoriaRepository.countLogs(whereClause),
      AuditoriaRepository.findLogs(whereClause, skip, input.limite),
    ]);

    return {
      data: logs.map(log => ({
        ...log,
        // BigInt no es serializable en JSON nativo de TRPC sin superjson,
        // lo convertimos a string para evitar errores en el cliente
        logId: log.logId.toString(),
      })),
      meta: {
        total,
        pagina: input.pagina,
        limite: input.limite,
        totalPaginas: Math.ceil(total / input.limite),
      }
    };
  }
}
