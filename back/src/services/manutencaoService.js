import db from '../config/db.js';
import AppError from '../utils/appError.js';
import { paginate } from '../utils/paginate.js';

// 1. Listagem Paginada de Manutenções (Super Leve)
export const listManutencoes = async (query = {}) => {
  const {
    page,
    limit,
    search,
    fornecedor_id,
    data_inicio,
    data_fim,
    tipo_manutencao,
    finalizado,
    sortBy,
    sortOrder,
  } = query;

  const where = {};

  if (fornecedor_id) {
    where.fornecedor_id = Number(fornecedor_id);
  }

  if (tipo_manutencao) {
    where.tipo_manutencao = tipo_manutencao;
  }

  if (finalizado !== undefined) {
    where.finalizado = finalizado === 'true' || finalizado === true;
  }

  if (data_inicio || data_fim) {
    where.data = {};
    if (data_inicio) where.data.gte = new Date(data_inicio);
    if (data_fim) where.data.lte = new Date(data_fim);
  }

  if (search) {
    where.OR = [
      { nota_fiscal: { contains: search, mode: 'insensitive' } },
      { forma_aquisicao: { contains: search, mode: 'insensitive' } },
      { observacoes: { contains: search, mode: 'insensitive' } },
      // Solicitação é Int, então se a busca for um número, tenta buscar exato
      ...(isNaN(Number(search)) ? [] : [{ solicitacao: Number(search) }]),
    ];
  }

  return await paginate(db.manutencao, {
    page,
    limit,
    where,
    include: {
      fornecedor: true,
      _count: {
        select: { itens: true },
      },
    },
    sortBy,
    sortOrder,
    defaultSortBy: 'id',
    allowedSortFields: [
      'id',
      'data',
      'nota_fiscal',
      'solicitacao',
      'finalizado',
      'forma_aquisicao',
      'tipo_manutencao',
    ],
  });
};

// 2. Buscar Manutenção Específica (Master)
export const findManutencaoById = async (id) => {
  const manutencao = await db.manutencao.findUnique({
    where: { id: Number(id) },
    include: {
      fornecedor: true,
      _count: {
        select: { itens: true },
      },
    },
  });

  if (!manutencao) {
    throw new AppError('Manutenção não encontrada.', 404);
  }

  return manutencao;
};

// 3. Buscar Itens de uma Manutenção (Detail Paginado)
export const findItensByManutencaoId = async (manutencaoId, query = {}) => {
  const { page, limit, sortBy, sortOrder } = query;

  await db.manutencao.findUniqueOrThrow({
    where: { id: Number(manutencaoId) },
  });

  return await paginate(db.itemManutencao, {
    page,
    limit,
    where: { manutencao_id: Number(manutencaoId) },
    include: {
      equipamento: {
        select: {
          id: true,
          patrimonio: true,
          tipo: true,
          modelo: true,
          local: {
            select: {
              nome_local: true,
              predio: {
                select: { nome_predio: true },
              },
            },
          },
        },
      },
    },
    sortBy,
    sortOrder,
    defaultSortBy: 'id',
    allowedSortFields: ['id', 'valor_unitario', 'quantidade'],
  });
};

// 4. Criar Manutenção com itens vinculados
export const createManutencao = async (dataPayload) => {
  const { itens, ...manutencaoData } = dataPayload;

  return await db.$transaction(async (tx) => {
    return await tx.manutencao.create({
      data: {
        data: new Date(manutencaoData.data),
        nota_fiscal: manutencaoData.nota_fiscal,
        solicitacao: Number(manutencaoData.solicitacao),
        finalizado: manutencaoData.finalizado ?? false,
        forma_aquisicao: manutencaoData.forma_aquisicao || null,
        tipo_manutencao: manutencaoData.tipo_manutencao || null,
        observacoes: manutencaoData.observacoes || null,
        fornecedor_id: Number(manutencaoData.fornecedor_id),
        ...(itens && itens.length > 0
          ? {
              itens: {
                create: itens.map((item) => ({
                  descricao: item.descricao,
                  quantidade: parseFloat(item.quantidade) || 1,
                  valor_unitario: parseFloat(item.valor_unitario) || 0,
                  equipamento_id: Number(item.equipamento_id),
                })),
              },
            }
          : {}),
      },
      include: {
        fornecedor: true,
        _count: { select: { itens: true } },
      },
    });
  });
};

// 5. Atualizar dados da Manutenção (Capa/Master)
export const updateManutencao = async (id, dataPayload) => {
  await db.manutencao.findUniqueOrThrow({
    where: { id: Number(id) },
  });

  const updateData = {};
  if (dataPayload.data !== undefined)
    updateData.data = new Date(dataPayload.data);
  if (dataPayload.nota_fiscal !== undefined)
    updateData.nota_fiscal = dataPayload.nota_fiscal;
  if (dataPayload.solicitacao !== undefined)
    updateData.solicitacao = Number(dataPayload.solicitacao);
  if (dataPayload.finalizado !== undefined)
    updateData.finalizado = dataPayload.finalizado;
  if (dataPayload.forma_aquisicao !== undefined)
    updateData.forma_aquisicao = dataPayload.forma_aquisicao;
  if (dataPayload.tipo_manutencao !== undefined)
    updateData.tipo_manutencao = dataPayload.tipo_manutencao;
  if (dataPayload.observacoes !== undefined)
    updateData.observacoes = dataPayload.observacoes;
  if (dataPayload.fornecedor_id !== undefined)
    updateData.fornecedor_id = Number(dataPayload.fornecedor_id);

  return await db.manutencao.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      fornecedor: true,
    },
  });
};

// 6. Deletar Manutenção Completa (Cascade apagará os itens se configurado no DB)
export const deleteManutencao = async (id) => {
  await db.manutencao.findUniqueOrThrow({
    where: { id: Number(id) },
  });

  return await db.manutencao.delete({
    where: { id: Number(id) },
  });
};

// --- Operações Diretas de Itens de Manutenção ---

// 7. Adicionar um item isolado a uma manutenção já existente
export const addItemManutencao = async (manutencaoId, itemData) => {
  await db.manutencao.findUniqueOrThrow({
    where: { id: Number(manutencaoId) },
  });

  return await db.itemManutencao.create({
    data: {
      descricao: itemData.descricao,
      quantidade: parseFloat(itemData.quantidade) || 1,
      valor_unitario: parseFloat(itemData.valor_unitario) || 0,
      equipamento_id: Number(itemData.equipamento_id),
      manutencao_id: Number(manutencaoId),
    },
    include: {
      equipamento: {
        select: {
          patrimonio: true,
          modelo: true,
        },
      },
    },
  });
};

// 8. Remover um item isolado
export const deleteItemManutencao = async (itemId) => {
  await db.itemManutencao.findUniqueOrThrow({
    where: { id: Number(itemId) },
  });

  return await db.itemManutencao.delete({
    where: { id: Number(itemId) },
  });
};
