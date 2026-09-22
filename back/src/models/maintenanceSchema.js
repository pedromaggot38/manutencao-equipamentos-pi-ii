import { Type } from '@sinclair/typebox';

export const idParamSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1, description: 'ID numérico do registro' }),
  },
  {
    examples: [{ id: 1 }],
  },
);

// --- Prédios ---

export const createPredioSchema = Type.Object(
  {
    nome_predio: Type.String({ minLength: 2, maxLength: 255 }),
    descricao: Type.Optional(Type.String({ maxLength: 255 })),
  },
  {
    examples: [
      {
        nome_predio: 'Prédio Central - Bloco A',
        descricao: 'Setor administrativo e laboratórios de informática',
      },
    ],
  },
);

export const updatePredioSchema = Type.Partial(createPredioSchema, {
  examples: [
    {
      nome_predio: 'Prédio Central - Bloco A (Reformado)',
    },
  ],
});

// --- Locais ---

export const createLocalSchema = Type.Object(
  {
    nome_local: Type.String({ minLength: 2, maxLength: 255 }),
    predio_id: Type.Integer({ minimum: 1 }),
  },
  {
    examples: [
      {
        nome_local: 'Laboratório de TI 01',
        predio_id: 1,
      },
    ],
  },
);

export const updateLocalSchema = Type.Partial(createLocalSchema, {
  examples: [
    {
      nome_local: 'Laboratório de TI 02',
    },
  ],
});

// --- Grupos ---

export const createGrupoSchema = Type.Object(
  {
    nome_grupo: Type.String({ minLength: 2, maxLength: 100 }),
  },
  {
    examples: [
      {
        nome_grupo: 'Tecnologia da Informação',
      },
    ],
  },
);

export const updateGrupoSchema = Type.Partial(createGrupoSchema, {
  examples: [
    {
      nome_grupo: 'Equipamentos de Climatização',
    },
  ],
});

// --- Categorias ---

export const createCategoriaSchema = Type.Object(
  {
    nome_categoria: Type.String({ minLength: 2, maxLength: 100 }),
    grupo_id: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  {
    examples: [
      {
        nome_categoria: 'Computadores e Servidores',
        grupo_id: 1,
      },
    ],
  },
);

export const updateCategoriaSchema = Type.Partial(createCategoriaSchema, {
  examples: [
    {
      nome_categoria: 'Ar-Condicionado Split',
    },
  ],
});

// --- Marcas ---

export const createMarcaSchema = Type.Object(
  {
    marca: Type.String({ minLength: 1, maxLength: 100 }),
  },
  {
    examples: [
      {
        marca: 'Dell',
      },
    ],
  },
);

export const updateMarcaSchema = Type.Partial(createMarcaSchema, {
  examples: [
    {
      marca: 'Lenovo',
    },
  ],
});

// --- Equipamentos ---

export const createEquipamentoSchema = Type.Object(
  {
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
  },
  {
    examples: [
      {
        patrimonio: 'PAT-2026-001',
        capacidade: 9000,
        unidade_medida: 'BTUs',
        valor_bem: 2850.0,
        situacao: 'Ativo',
        tipo: 'Split Inverter',
        modelo: 'WindFree Pro',
        categoria_id: 1,
        marca_id: 1,
        local_id: 1,
      },
    ],
  },
);

export const updateEquipamentoSchema = Type.Partial(createEquipamentoSchema, {
  examples: [
    {
      situacao: 'Em Manutenção',
      valor_bem: 3000.0,
    },
  ],
});

export const queryEquipamentoSchema = Type.Object(
  {
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 10 }),
    ),
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
  },
  {
    examples: [
      {
        page: 1,
        limit: 10,
        situacao: 'Ativo',
        sortOrder: 'desc',
      },
    ],
  },
);

// --- Fornecedores ---

export const createFornecedorSchema = Type.Object(
  {
    razao_social: Type.String({ minLength: 2, maxLength: 255 }),
    cnpj: Type.String({ minLength: 14, maxLength: 20 }),
    telefone: Type.Optional(Type.String({ maxLength: 30 })),
    email: Type.Optional(Type.String({ format: 'email', maxLength: 150 })),
  },
  {
    examples: [
      {
        razao_social: 'Climatização & Serviços Técnicos Ltda',
        cnpj: '12.345.678/0001-90',
        telefone: '1833020000',
        email: 'contato@climatizacaoservicos.com.br',
      },
    ],
  },
);

export const updateFornecedorSchema = Type.Partial(createFornecedorSchema, {
  examples: [
    {
      telefone: '18997001122',
      email: 'suporte@climatizacaoservicos.com.br',
    },
  ],
});

// --- Manutenções ---

export const createManutencaoSchema = Type.Object(
  {
    data: Type.String({ format: 'date' }),
    nota_fiscal: Type.String({ minLength: 1, maxLength: 100 }),
    solicitacao: Type.Integer({ minimum: 0 }),
    finalizado: Type.Optional(Type.Boolean({ default: false })),
    forma_aquisicao: Type.Optional(Type.String({ maxLength: 100 })),
    tipo_manutencao: Type.Optional(Type.String({ maxLength: 100 })),
    observacoes: Type.Optional(Type.String()),
    fornecedor_id: Type.Integer({ minimum: 1 }),

    itens: Type.Optional(
      Type.Array(
        Type.Object({
          descricao: Type.String({ minLength: 2 }),
          quantidade: Type.Number({ minimum: 0.01 }),
          valor_unitario: Type.Number({ minimum: 0 }),
          equipamento_id: Type.Integer({ minimum: 1 }),
        }),
      ),
    ),
  },
  {
    examples: [
      {
        data: '2026-08-29',
        nota_fiscal: 'NF-89210',
        solicitacao: 4410,
        finalizado: false,
        forma_aquisicao: 'Contrato Direto',
        tipo_manutencao: 'Preventiva',
        observacoes: 'Higienização geral dos condensadores e recarga de gás.',
        fornecedor_id: 1,
        itens: [
          {
            descricao: 'Higienização e troca de filtros de ar',
            quantidade: 1,
            valor_unitario: 180.0,
            equipamento_id: 1,
          },
        ],
      },
    ],
  },
);

export const updateManutencaoSchema = Type.Partial(createManutencaoSchema, {
  examples: [
    {
      finalizado: true,
      observacoes: 'Serviço concluído e testado pela equipe técnica.',
    },
  ],
});

// --- Itens de Manutenção ---

export const createItemManutencaoSchema = Type.Object(
  {
    descricao: Type.String({ minLength: 2 }),
    quantidade: Type.Number({ minimum: 0.01 }),
    valor_unitario: Type.Number({ minimum: 0 }),
    equipamento_id: Type.Integer({ minimum: 1 }),
    manutencao_id: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  {
    examples: [
      {
        descricao: 'Substituição de capacitor e motor ventilador',
        quantidade: 1,
        valor_unitario: 240.0,
        equipamento_id: 1,
        manutencao_id: 1,
      },
    ],
  },
);

export const updateItemManutencaoSchema = Type.Partial(
  createItemManutencaoSchema,
  {
    examples: [
      {
        quantidade: 2,
        valor_unitario: 220.0,
      },
    ],
  },
);
