import * as manutencaoController from '../controllers/manutencaoController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import {
  createManutencaoSchema,
  updateManutencaoSchema,
  createItemManutencaoSchema,
  idParamSchema,
} from '../models/maintenanceSchema.js';

export default async function manutencaoRoutes(fastify, options) {
  fastify.addHook('preHandler', protect);

  fastify.get('/', manutencaoController.listManutencoes);

  fastify.get(
    '/:id',
    { schema: { params: idParamSchema } },
    manutencaoController.getManutencaoById,
  );

  fastify.post(
    '/',
    { schema: { body: createManutencaoSchema } },
    manutencaoController.createManutencao,
  );

  fastify.patch(
    '/:id',
    { schema: { params: idParamSchema, body: updateManutencaoSchema } },
    manutencaoController.updateManutencao,
  );

  fastify.delete(
    '/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    manutencaoController.deleteManutencao,
  );

  // --- Rotas de Itens (Detail) ---

  fastify.get(
    '/:id/itens',
    { schema: { params: idParamSchema } },
    manutencaoController.listItens,
  );

  fastify.post(
    '/:id/itens',
    { schema: { params: idParamSchema, body: createItemManutencaoSchema } },
    manutencaoController.addItem,
  );

  fastify.delete(
    '/itens/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    manutencaoController.removeItem,
  );
}
