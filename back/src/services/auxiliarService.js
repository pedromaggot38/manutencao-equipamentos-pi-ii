import db from '../config/db.js';
import AppError from '../utils/appError.js';
import { paginate } from '../utils/paginate.js';

const createCrudService = (
  model,
  modelName,
  defaultSort = 'id',
  allowedSort = ['id'],
  searchFields = [],
) => ({
  findAll: async (query = {}, customWhere = {}, include = undefined) => {
    const { page, limit, sortBy, sortOrder, search, ...restQuery } = query;
    const where = { ...customWhere };

    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));

      where.AND = [...(where.AND || []), { OR: searchConditions }];
    }

    return await paginate(model, {
      page,
      limit,
      where,
      include,
      sortBy,
      sortOrder,
      defaultSortBy: defaultSort,
      allowedSortFields: allowedSort,
    });
  },

  findById: async (id, include = undefined) => {
    const record = await model.findUnique({
      where: { id: Number(id) },
      include,
    });
    if (!record) throw new AppError(`${modelName} não encontrado(a).`, 404);
    return record;
  },

  create: async (data, include = undefined) => {
    return await model.create({
      data,
      include,
    });
  },

  update: async (id, data, include = undefined) => {
    await model.findUniqueOrThrow({ where: { id: Number(id) } });
    return await model.update({
      where: { id: Number(id) },
      data,
      include,
    });
  },

  delete: async (id) => {
    await model.findUniqueOrThrow({ where: { id: Number(id) } });
    return await model.delete({
      where: { id: Number(id) },
    });
  },
});

// --- Exportações por Entidade ---

export const predioService = createCrudService(
  db.predio,
  'Prédio',
  'id',
  ['id', 'nome_predio'],
  ['nome_predio'],
);

export const grupoService = createCrudService(
  db.grupo,
  'Grupo',
  'id',
  ['id', 'nome_grupo'],
  ['nome_grupo'],
);

export const marcaService = createCrudService(
  db.marca,
  'Marca',
  'id',
  ['id', 'marca'],
  ['marca'],
);

export const localService = {
  ...createCrudService(
    db.local,
    'Local',
    'id',
    ['id', 'nome_local'],
    ['nome_local'],
  ),
  findAllWithFilters: async (query = {}) => {
    const { predio_id, ...restQuery } = query;
    const customWhere = {};

    if (predio_id) customWhere.predio_id = Number(predio_id);

    return await localService.findAll(restQuery, customWhere, { predio: true });
  },
};

export const categoriaService = {
  ...createCrudService(
    db.categoria,
    'Categoria',
    'id',
    ['id', 'nome_categoria'],
    ['nome_categoria'],
  ),
  findAllWithFilters: async (query = {}) => {
    const { grupo_id, ...restQuery } = query;
    const customWhere = {};

    if (grupo_id) customWhere.grupo_id = Number(grupo_id);

    return await categoriaService.findAll(restQuery, customWhere, {
      grupo: true,
    });
  },
};

export const fornecedorService = {
  ...createCrudService(
    db.fornecedor,
    'Fornecedor',
    'id',
    ['id', 'razao_social', 'cnpj'],
    ['razao_social', 'cnpj', 'email'],
  ),
  findAllWithFilters: async (query = {}) => {
    return await fornecedorService.findAll(query);
  },
};
