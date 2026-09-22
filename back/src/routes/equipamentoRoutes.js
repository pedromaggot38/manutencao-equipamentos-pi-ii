import * as equipamentoController from '../controllers/equipamentoController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import {
  createEquipamentoSchema,
  updateEquipamentoSchema,
  queryEquipamentoSchema,
  idParamSchema,
} from '../models/maintenanceSchema.js';

export default async function equipamentoRoutes(fastify, options) {
  fastify.addHook('preHandler', protect);

  fastify.get(
    '/',
    { schema: { querystring: queryEquipamentoSchema } },
    equipamentoController.listEquipamentos,
  );

  fastify.get(
    '/:id',
    { schema: { params: idParamSchema } },
    equipamentoController.getEquipamentoById,
  );

  fastify.post(
    '/',
    { schema: { body: createEquipamentoSchema } },
    equipamentoController.createEquipamento,
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: updateEquipamentoSchema,
      },
    },
    equipamentoController.updateEquipamento,
  );

  fastify.delete(
    '/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    equipamentoController.deleteEquipamento,
  );
}
