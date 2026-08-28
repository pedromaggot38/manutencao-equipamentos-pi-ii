import {
  predioService,
  localService,
  grupoService,
  categoriaService,
  marcaService,
  fornecedorService,
} from '../services/auxiliarService.js';
import { resfc } from '../utils/resfc.js';

// --- Prédios ---
export const listPredios = async (req, reply) => {
  const { data, pagination } = await predioService.findAll(req.query);
  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Prédios listados com sucesso.',
  });
};

export const getPredio = async (req, reply) => {
  const data = await predioService.findById(req.params.id, { locais: true });
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Prédio encontrado com sucesso.',
  });
};

export const createPredio = async (req, reply) => {
  const data = await predioService.create(req.body);
  return resfc({
    reply,
    code: 201,
    data,
    message: 'Prédio criado com sucesso.',
  });
};

export const updatePredio = async (req, reply) => {
  const data = await predioService.update(req.params.id, req.body);
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Prédio atualizado com sucesso.',
  });
};

export const deletePredio = async (req, reply) => {
  await predioService.delete(req.params.id);
  return resfc({
    reply,
    code: 200,
    message: 'Prédio excluído com sucesso.',
  });
};

// --- Locais ---
export const listLocais = async (req, reply) => {
  const { data, pagination } = await localService.findAllWithFilters(req.query);
  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Locais listados com sucesso.',
  });
};

export const getLocal = async (req, reply) => {
  const data = await localService.findById(req.params.id, { predio: true });
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Local encontrado com sucesso.',
  });
};

export const createLocal = async (req, reply) => {
  const data = await localService.create(req.body, { predio: true });
  return resfc({
    reply,
    code: 201,
    data,
    message: 'Local criado com sucesso.',
  });
};

export const updateLocal = async (req, reply) => {
  const data = await localService.update(req.params.id, req.body, {
    predio: true,
  });
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Local atualizado com sucesso.',
  });
};

export const deleteLocal = async (req, reply) => {
  await localService.delete(req.params.id);
  return resfc({
    reply,
    code: 200,
    message: 'Local excluído com sucesso.',
  });
};

// --- Grupos ---
export const listGrupos = async (req, reply) => {
  const { data, pagination } = await grupoService.findAll(req.query);
  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Grupos listados com sucesso.',
  });
};

export const getGrupo = async (req, reply) => {
  const data = await grupoService.findById(req.params.id, { categorias: true });
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Grupo encontrado com sucesso.',
  });
};

export const createGrupo = async (req, reply) => {
  const data = await grupoService.create(req.body);
  return resfc({
    reply,
    code: 201,
    data,
    message: 'Grupo criado com sucesso.',
  });
};

export const updateGrupo = async (req, reply) => {
  const data = await grupoService.update(req.params.id, req.body);
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Grupo atualizado com sucesso.',
  });
};

export const deleteGrupo = async (req, reply) => {
  await grupoService.delete(req.params.id);
  return resfc({
    reply,
    code: 200,
    message: 'Grupo excluído com sucesso.',
  });
};

// --- Categorias ---
export const listCategorias = async (req, reply) => {
  const { data, pagination } = await categoriaService.findAllWithFilters(
    req.query,
  );
  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Categorias listadas com sucesso.',
  });
};

export const getCategoria = async (req, reply) => {
  const data = await categoriaService.findById(req.params.id, { grupo: true });
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Categoria encontrada com sucesso.',
  });
};

export const createCategoria = async (req, reply) => {
  const data = await categoriaService.create(req.body, { grupo: true });
  return resfc({
    reply,
    code: 201,
    data,
    message: 'Categoria criada com sucesso.',
  });
};

export const updateCategoria = async (req, reply) => {
  const data = await categoriaService.update(req.params.id, req.body, {
    grupo: true,
  });
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Categoria atualizada com sucesso.',
  });
};

export const deleteCategoria = async (req, reply) => {
  await categoriaService.delete(req.params.id);
  return resfc({
    reply,
    code: 200,
    message: 'Categoria excluída com sucesso.',
  });
};

// --- Marcas ---
export const listMarcas = async (req, reply) => {
  const { data, pagination } = await marcaService.findAll(req.query);
  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Marcas listadas com sucesso.',
  });
};

export const getMarca = async (req, reply) => {
  const data = await marcaService.findById(req.params.id);
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Marca encontrada com sucesso.',
  });
};

export const createMarca = async (req, reply) => {
  const data = await marcaService.create(req.body);
  return resfc({
    reply,
    code: 201,
    data,
    message: 'Marca criada com sucesso.',
  });
};

export const updateMarca = async (req, reply) => {
  const data = await marcaService.update(req.params.id, req.body);
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Marca atualizada com sucesso.',
  });
};

export const deleteMarca = async (req, reply) => {
  await marcaService.delete(req.params.id);
  return resfc({
    reply,
    code: 200,
    message: 'Marca excluída com sucesso.',
  });
};

// --- Fornecedores ---
export const listFornecedores = async (req, reply) => {
  const { data, pagination } = await fornecedorService.findAllWithFilters(
    req.query,
  );
  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Fornecedores listados com sucesso.',
  });
};

export const getFornecedor = async (req, reply) => {
  const data = await fornecedorService.findById(req.params.id, {
    manutencoes: true,
  });
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Fornecedor encontrado com sucesso.',
  });
};

export const createFornecedor = async (req, reply) => {
  const data = await fornecedorService.create(req.body);
  return resfc({
    reply,
    code: 201,
    data,
    message: 'Fornecedor cadastrado com sucesso.',
  });
};

export const updateFornecedor = async (req, reply) => {
  const data = await fornecedorService.update(req.params.id, req.body);
  return resfc({
    reply,
    code: 200,
    data,
    message: 'Fornecedor atualizado com sucesso.',
  });
};

export const deleteFornecedor = async (req, reply) => {
  await fornecedorService.delete(req.params.id);
  return resfc({
    reply,
    code: 200,
    message: 'Fornecedor excluído com sucesso.',
  });
};
