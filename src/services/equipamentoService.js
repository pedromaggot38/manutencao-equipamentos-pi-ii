import db from '../config/db.js';
import AppError from '../utils/appError.js';
import { paginate } from '../utils/paginate.js';

export const listEquipamentos = async (query = {}) => {
  const {
    page,
    limit,
    search,
    situacao,
    categoria_id,
    marca_id,
    local_id,
    predio_id,
    sortBy,
    sortOrder,
  } = query;

  const where = {};

  if (situacao) where.situacao = situacao;
  if (categoria_id) where.categoria_id = Number(categoria_id);
  if (marca_id) where.marca_id = Number(marca_id);
  if (local_id) where.local_id = Number(local_id);

  if (predio_id) {
    where.local = {
      predio_id: Number(predio_id),
    };
  }

  if (search) {
    where.OR = [
      { patrimonio: { contains: search, mode: 'insensitive' } },
      { modelo: { contains: search, mode: 'insensitive' } },
      { tipo: { contains: search, mode: 'insensitive' } },
    ];
  }

  return await paginate(db.equipamento, {
    page,
    limit,
    where,
    include: {
      categoria: true,
      marca: true,
      local: {
        include: {
          predio: true,
        },
      },
    },
    sortBy,
    sortOrder,
    defaultSortBy: 'id',
    allowedSortFields: [
      'id',
      'patrimonio',
      'capacidade',
      'valor_bem',
      'situacao',
    ],
  });
};

export const findEquipamentoById = async (id) => {
  const equipamento = await db.equipamento.findUnique({
    where: { id: Number(id) },
    include: {
      categoria: true,
      marca: true,
      local: {
        include: { predio: true },
      },
      itens: {
        include: {
          manutencao: {
            include: { fornecedor: true },
          },
        },
      },
    },
  });

  if (!equipamento) {
    throw new AppError('Equipamento não encontrado.', 404);
  }

  return equipamento;
};

export const createEquipamento = async (data) => {
  return await db.equipamento.create({
    data: {
      patrimonio: String(data.patrimonio),
      capacidade: parseFloat(data.capacidade) || 0,
      unidade_medida: data.unidade_medida,
      valor_bem: parseFloat(data.valor_bem) || 0,
      situacao: data.situacao || 'Ativo',
      tipo: data.tipo || null,
      modelo: data.modelo || null,
      categoria_id: Number(data.categoria_id),
      marca_id: Number(data.marca_id),
      local_id: Number(data.local_id),
    },
    include: {
      categoria: true,
      marca: true,
      local: true,
    },
  });
};

export const updateEquipamento = async (id, data) => {
  await db.equipamento.findUniqueOrThrow({
    where: { id: Number(id) },
  });

  const updateData = {};

  if (data.patrimonio !== undefined)
    updateData.patrimonio = String(data.patrimonio);
  if (data.capacidade !== undefined)
    updateData.capacidade = parseFloat(data.capacidade);
  if (data.unidade_medida !== undefined)
    updateData.unidade_medida = data.unidade_medida;
  if (data.valor_bem !== undefined)
    updateData.valor_bem = parseFloat(data.valor_bem);
  if (data.situacao !== undefined) updateData.situacao = data.situacao;
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.modelo !== undefined) updateData.modelo = data.modelo;
  if (data.categoria_id !== undefined)
    updateData.categoria_id = Number(data.categoria_id);
  if (data.marca_id !== undefined) updateData.marca_id = Number(data.marca_id);
  if (data.local_id !== undefined) updateData.local_id = Number(data.local_id);

  return await db.equipamento.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      categoria: true,
      marca: true,
      local: true,
    },
  });
};

export const deleteEquipamento = async (id) => {
  await db.equipamento.findUniqueOrThrow({
    where: { id: Number(id) },
  });

  return await db.equipamento.delete({
    where: { id: Number(id) },
  });
};
