import type { FastifyPluginAsync } from 'fastify';
import { importacionesService } from './importaciones.service';

export const importacionesController: FastifyPluginAsync = async (server) => {
  server.post('/catalogo', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ ok: false, message: 'No se envió ningún archivo.' });
      }

      let cicloIdStr = '';
      const cicloIdField = data.fields?.cicloId;
      if (cicloIdField) {
        if ('value' in cicloIdField) {
          cicloIdStr = String(cicloIdField.value);
        } else if (Array.isArray(cicloIdField) && cicloIdField.length > 0 && 'value' in cicloIdField[0]) {
          cicloIdStr = String(cicloIdField[0].value);
        }
      }

      if (!cicloIdStr) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId es requerido.' });
      }

      const cicloId = parseInt(cicloIdStr, 10);
      if (isNaN(cicloId)) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId debe ser numérico.' });
      }

      const buffer = await data.toBuffer();
      
      const result = await importacionesService.procesarImportacionCatalogo(buffer, cicloId);
      
      return reply.send({ ok: true, message: result.message });
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ ok: false, message: error.message });
    }
  });

  server.post('/inscripciones', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ ok: false, message: 'No se envió ningún archivo.' });
      }

      let cicloIdStr = '';
      const cicloIdField = data.fields?.cicloId;
      if (cicloIdField) {
        if ('value' in cicloIdField) {
          cicloIdStr = String(cicloIdField.value);
        } else if (Array.isArray(cicloIdField) && cicloIdField.length > 0 && 'value' in cicloIdField[0]) {
          cicloIdStr = String(cicloIdField[0].value);
        }
      }

      if (!cicloIdStr) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId es requerido.' });
      }

      const cicloId = parseInt(cicloIdStr, 10);
      if (isNaN(cicloId)) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId debe ser numérico.' });
      }

      const buffer = await data.toBuffer();
      
      const result = await importacionesService.procesarImportacionInscripciones(buffer, cicloId);
      
      return reply.send({ ok: true, message: result.message });
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ ok: false, message: error.message });
    }
  });

  server.post('/pagos', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ ok: false, message: 'No se envió ningún archivo.' });
      }

      let cicloIdStr = '';
      const cicloIdField = data.fields?.cicloId;
      if (cicloIdField) {
        if ('value' in cicloIdField) {
          cicloIdStr = String(cicloIdField.value);
        } else if (Array.isArray(cicloIdField) && cicloIdField.length > 0 && 'value' in cicloIdField[0]) {
          cicloIdStr = String(cicloIdField[0].value);
        }
      }

      if (!cicloIdStr) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId es requerido.' });
      }

      const cicloId = parseInt(cicloIdStr, 10);
      if (isNaN(cicloId)) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId debe ser numérico.' });
      }

      const buffer = await data.toBuffer();
      
      const result = await importacionesService.procesarImportacionPagos(buffer, cicloId);
      
      return reply.send({ ok: true, message: result.message });
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ ok: false, message: error.message });
    }
  });

  server.post('/saldos', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ ok: false, message: 'No se envió ningún archivo.' });
      }

      let cicloIdStr = '';
      const cicloIdField = data.fields?.cicloId;
      if (cicloIdField) {
        if ('value' in cicloIdField) {
          cicloIdStr = String(cicloIdField.value);
        } else if (Array.isArray(cicloIdField) && cicloIdField.length > 0 && 'value' in cicloIdField[0]) {
          cicloIdStr = String(cicloIdField[0].value);
        }
      }

      if (!cicloIdStr) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId es requerido.' });
      }

      const cicloId = parseInt(cicloIdStr, 10);
      if (isNaN(cicloId)) {
        return reply.status(400).send({ ok: false, message: 'El parámetro cicloId debe ser numérico.' });
      }

      const buffer = await data.toBuffer();
      
      const result = await importacionesService.procesarImportacionSaldos(buffer, cicloId);
      
      return reply.send({ ok: true, message: result.message });
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ ok: false, message: error.message });
    }
  });
};
