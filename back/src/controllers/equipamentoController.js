import * as equipamentoService from '../services/equipamentoService.js';
import { resfc } from '../utils/resfc.js';

export const listEquipamentos = async (request, reply) => {
  const { data, pagination } = await equipamentoService.listEquipamentos(
    request.query,
  );

  return resfc({
    reply,
    code: 200,
    data,
    meta: pagination,
    message: 'Equipamentos listados com sucesso.',
  });
};

export const getEquipamentoById = async (request, reply) => {
  const { id } = request.params;
  const equipamento = await equipamentoService.findEquipamentoById(Number(id));

  return resfc({
    reply,
    code: 200,
    data: equipamento,
    message: 'Equipamento recuperado com sucesso.',
  });
};

export const createEquipamento = async (request, reply) => {
  const novoEquipamento = await equipamentoService.createEquipamento(
    request.body,
  );

  return resfc({
    reply,
    code: 201,
    data: novoEquipamento,
    message: 'Equipamento cadastrado com sucesso.',
  });
};

export const updateEquipamento = async (request, reply) => {
  const { id } = request.params;
  const equipamentoAtualizado = await equipamentoService.updateEquipamento(
    Number(id),
    request.body,
  );

  return resfc({
    reply,
    code: 200,
    data: equipamentoAtualizado,
    message: 'Equipamento atualizado com sucesso.',
  });
};

export const deleteEquipamento = async (request, reply) => {
  const { id } = request.params;
  await equipamentoService.deleteEquipamento(Number(id));

  return resfc({
    reply,
    code: 200,
    message: 'Equipamento removido com sucesso.',
  });
};
