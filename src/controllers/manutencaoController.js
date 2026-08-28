import * as manutencaoService from '../services/manutencaoService.js';
import { resfc } from '../utils/resfc.js';

export const listManutencoes = async (request, reply) => {
  const { data, pagination } = await manutencaoService.listManutencoes(
    request.query,
  );

  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Manutenções listadas com sucesso.',
  });
};

export const getManutencaoById = async (request, reply) => {
  const { id } = request.params;
  const manutencao = await manutencaoService.findManutencaoById(Number(id));

  return resfc({
    reply,
    code: 200,
    data: manutencao,
    message: 'Manutenção recuperada com sucesso.',
  });
};

export const listItens = async (request, reply) => {
  const { id } = request.params;
  const { data, pagination } = await manutencaoService.findItensByManutencaoId(
    Number(id),
    request.query,
  );

  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Itens da manutenção listados com sucesso.',
  });
};

export const createManutencao = async (request, reply) => {
  const novaManutencao = await manutencaoService.createManutencao(request.body);

  return resfc({
    reply,
    code: 201,
    data: novaManutencao,
    message: 'Manutenção cadastrada com sucesso.',
  });
};

export const updateManutencao = async (request, reply) => {
  const { id } = request.params;
  const manutencaoAtualizada = await manutencaoService.updateManutencao(
    Number(id),
    request.body,
  );

  return resfc({
    reply,
    code: 200,
    data: manutencaoAtualizada,
    message: 'Manutenção atualizada com sucesso.',
  });
};

export const deleteManutencao = async (request, reply) => {
  const { id } = request.params;
  await manutencaoService.deleteManutencao(Number(id));

  return resfc({
    reply,
    code: 200,
    message: 'Manutenção removida com sucesso.',
  });
};

export const addItem = async (request, reply) => {
  const { id } = request.params;
  const item = await manutencaoService.addItemManutencao(
    Number(id),
    request.body,
  );

  return resfc({
    reply,
    code: 201,
    data: item,
    message: 'Item adicionado à manutenção com sucesso.',
  });
};

export const removeItem = async (request, reply) => {
  const { itemId } = request.params;
  await manutencaoService.deleteItemManutencao(Number(itemId));

  return resfc({
    reply,
    code: 200,
    message: 'Item removido da manutenção com sucesso.',
  });
};
