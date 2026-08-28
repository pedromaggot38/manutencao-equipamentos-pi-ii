import { Type } from '@sinclair/typebox';

export const idParamSchema = Type.Object({
  id: Type.Integer({ minimum: 1, description: 'ID numérico do registro' }),
});

export const createPredioSchema = Type.Object({
  nome_predio: Type.String({ minLength: 2, maxLength: 255 }),
  descricao: Type.Optional(Type.String({ maxLength: 255 })),
});

export const updatePredioSchema = Type.Partial(createPredioSchema);

export const createLocalSchema = Type.Object({
  nome_local: Type.String({ minLength: 2, maxLength: 255 }),
  predio_id: Type.Integer({ minimum: 1 }),
});

export const updateLocalSchema = Type.Partial(createLocalSchema);

export const createGrupoSchema = Type.Object({
  nome_grupo: Type.String({ minLength: 2, maxLength: 100 }),
});

export const updateGrupoSchema = Type.Partial(createGrupoSchema);

export const createCategoriaSchema = Type.Object({
  nome_categoria: Type.String({ minLength: 2, maxLength: 100 }),
  grupo_id: Type.Optional(Type.Integer({ minimum: 1 })),
});

export const updateCategoriaSchema = Type.Partial(createCategoriaSchema);

export const createMarcaSchema = Type.Object({
  marca: Type.String({ minLength: 1, maxLength: 100 }),
});

export const updateMarcaSchema = Type.Partial(createMarcaSchema);

export const createEquipamentoSchema = Type.Object({
  patrimonio: Type.String({ minLength: 1, maxLength: 50 }),
  capacidade: Type.Number({ minimum: 0 }),
  unidade_medida: Type.String({ minLength: 1, maxLength: 50 }),
  valor_bem: Type.Number({ minimum: 0 }),
  situacao: Type.Optional(Type.String({ maxLength: 50, default: 'Ativo' })),
  tipo: Type.Optional(Type.String({ maxLength: 100 })),
  modelo: Type.Optional(Type.String({ maxLength: 100 })),
  categoria_id: Type.Integer({ minimum: 1 }),
  marca_id: Type.Integer({ minimum: 1 }),
  local_id: Type.Integer({ minimum: 1 }),
});

export const updateEquipamentoSchema = Type.Partial(createEquipamentoSchema);

export const queryEquipamentoSchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 10 })),
  search: Type.Optional(Type.String()),
  situacao: Type.Optional(Type.String()),
  categoria_id: Type.Optional(Type.Integer({ minimum: 1 })),
  marca_id: Type.Optional(Type.Integer({ minimum: 1 })),
  local_id: Type.Optional(Type.Integer({ minimum: 1 })),
  predio_id: Type.Optional(Type.Integer({ minimum: 1 })),
  sortBy: Type.Optional(Type.String()),
  sortOrder: Type.Optional(
    Type.Union([Type.Literal('asc'), Type.Literal('desc')]),
  ),
});

export const createFornecedorSchema = Type.Object({
  razao_social: Type.String({ minLength: 2, maxLength: 255 }),
  cnpj: Type.String({ minLength: 14, maxLength: 20 }),
  telefone: Type.Optional(Type.String({ maxLength: 30 })),
  email: Type.Optional(Type.String({ format: 'email', maxLength: 150 })),
});

export const updateFornecedorSchema = Type.Partial(createFornecedorSchema);

export const createManutencaoSchema = Type.Object({
  data: Type.String({ format: 'date' }), // Ex: '2026-05-13'
  nota_fiscal: Type.String({ minLength: 1, maxLength: 100 }),
  solicitacao: Type.Integer({ minimum: 0 }),
  finalizado: Type.Optional(Type.Boolean({ default: false })),
  forma_aquisicao: Type.Optional(Type.String({ maxLength: 100 })),
  tipo_manutencao: Type.Optional(Type.String({ maxLength: 100 })),
  observacoes: Type.Optional(Type.String()),
  fornecedor_id: Type.Integer({ minimum: 1 }),
});

export const updateManutencaoSchema = Type.Partial(createManutencaoSchema);

export const createItemManutencaoSchema = Type.Object({
  descricao: Type.String({ minLength: 2 }),
  quantidade: Type.Number({ minimum: 0.01 }),
  valor_unitario: Type.Number({ minimum: 0 }),
  equipamento_id: Type.Integer({ minimum: 1 }),
  manutencao_id: Type.Integer({ minimum: 1 }),
});

export const updateItemManutencaoSchema = Type.Partial(
  createItemManutencaoSchema,
);
