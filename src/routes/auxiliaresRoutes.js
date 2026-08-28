import { protect, restrictTo } from '../middlewares/auth.js';
import * as ac from '../controllers/auxiliarController.js';
import {
  idParamSchema,
  createPredioSchema,
  updatePredioSchema,
  createLocalSchema,
  updateLocalSchema,
  createGrupoSchema,
  updateGrupoSchema,
  createCategoriaSchema,
  updateCategoriaSchema,
  createMarcaSchema,
  updateMarcaSchema,
  createFornecedorSchema,
  updateFornecedorSchema,
} from '../models/maintenanceSchema.js';

export default async function auxiliaresRoutes(fastify, options) {
  fastify.addHook('preHandler', protect);

  // --- Prédios ---
  fastify.get('/predios', ac.listPredios);
  fastify.get(
    '/predios/:id',
    { schema: { params: idParamSchema } },
    ac.getPredio,
  );
  fastify.post(
    '/predios',
    { schema: { body: createPredioSchema } },
    ac.createPredio,
  );
  fastify.patch(
    '/predios/:id',
    { schema: { params: idParamSchema, body: updatePredioSchema } },
    ac.updatePredio,
  );
  fastify.delete(
    '/predios/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    ac.deletePredio,
  );

  // --- Locais ---
  fastify.get('/locais', ac.listLocais);
  fastify.get(
    '/locais/:id',
    { schema: { params: idParamSchema } },
    ac.getLocal,
  );
  fastify.post(
    '/locais',
    { schema: { body: createLocalSchema } },
    ac.createLocal,
  );
  fastify.patch(
    '/locais/:id',
    { schema: { params: idParamSchema, body: updateLocalSchema } },
    ac.updateLocal,
  );
  fastify.delete(
    '/locais/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    ac.deleteLocal,
  );

  // --- Grupos ---
  fastify.get('/grupos', ac.listGrupos);
  fastify.get(
    '/grupos/:id',
    { schema: { params: idParamSchema } },
    ac.getGrupo,
  );
  fastify.post(
    '/grupos',
    { schema: { body: createGrupoSchema } },
    ac.createGrupo,
  );
  fastify.patch(
    '/grupos/:id',
    { schema: { params: idParamSchema, body: updateGrupoSchema } },
    ac.updateGrupo,
  );
  fastify.delete(
    '/grupos/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    ac.deleteGrupo,
  );

  // --- Categorias ---
  fastify.get('/categorias', ac.listCategorias);
  fastify.get(
    '/categorias/:id',
    { schema: { params: idParamSchema } },
    ac.getCategoria,
  );
  fastify.post(
    '/categorias',
    { schema: { body: createCategoriaSchema } },
    ac.createCategoria,
  );
  fastify.patch(
    '/categorias/:id',
    { schema: { params: idParamSchema, body: updateCategoriaSchema } },
    ac.updateCategoria,
  );
  fastify.delete(
    '/categorias/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    ac.deleteCategoria,
  );

  // --- Marcas ---
  fastify.get('/marcas', ac.listMarcas);
  fastify.get(
    '/marcas/:id',
    { schema: { params: idParamSchema } },
    ac.getMarca,
  );
  fastify.post(
    '/marcas',
    { schema: { body: createMarcaSchema } },
    ac.createMarca,
  );
  fastify.patch(
    '/marcas/:id',
    { schema: { params: idParamSchema, body: updateMarcaSchema } },
    ac.updateMarca,
  );
  fastify.delete(
    '/marcas/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    ac.deleteMarca,
  );

  // --- Fornecedores ---
  fastify.get('/fornecedores', ac.listFornecedores);
  fastify.get(
    '/fornecedores/:id',
    { schema: { params: idParamSchema } },
    ac.getFornecedor,
  );
  fastify.post(
    '/fornecedores',
    { schema: { body: createFornecedorSchema } },
    ac.createFornecedor,
  );
  fastify.patch(
    '/fornecedores/:id',
    { schema: { params: idParamSchema, body: updateFornecedorSchema } },
    ac.updateFornecedor,
  );
  fastify.delete(
    '/fornecedores/:id',
    {
      schema: { params: idParamSchema },
      preHandler: [restrictTo('admin', 'root')],
    },
    ac.deleteFornecedor,
  );
}
