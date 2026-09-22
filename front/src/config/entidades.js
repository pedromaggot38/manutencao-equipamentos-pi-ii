export const entidadesConfig = {
  predios: {
    title: 'Prédios',
    endpoint: '/auxiliares/predios',
    columns: [
      { key: 'id', label: 'ID', mono: true },
      { key: 'nome_predio', label: 'Nome' },
      { key: 'descricao', label: 'Descrição' },
    ],
    fields: [
      { key: 'nome_predio', label: 'Nome do prédio', type: 'text', required: true },
      { key: 'descricao', label: 'Descrição', type: 'text' },
    ],
    emptyItem: { nome_predio: '', descricao: '' },
  },

  locais: {
    title: 'Locais',
    endpoint: '/auxiliares/locais',
    columns: [
      { key: 'id', label: 'ID', mono: true },
      { key: 'nome_local', label: 'Nome' },
      { key: 'predio_id', label: 'Prédio (ID)', mono: true },
    ],
    fields: [
      { key: 'nome_local', label: 'Nome do local', type: 'text', required: true },
      { key: 'predio_id', label: 'ID do prédio', type: 'number', required: true },
    ],
    emptyItem: { nome_local: '', predio_id: '' },
  },

  grupos: {
    title: 'Grupos',
    endpoint: '/auxiliares/grupos',
    columns: [
      { key: 'id', label: 'ID', mono: true },
      { key: 'nome_grupo', label: 'Nome' },
    ],
    fields: [{ key: 'nome_grupo', label: 'Nome do grupo', type: 'text', required: true }],
    emptyItem: { nome_grupo: '' },
  },

  categorias: {
    title: 'Categorias',
    endpoint: '/auxiliares/categorias',
    columns: [
      { key: 'id', label: 'ID', mono: true },
      { key: 'nome_categoria', label: 'Nome' },
      { key: 'grupo_id', label: 'Grupo (ID)', mono: true },
    ],
    fields: [
      { key: 'nome_categoria', label: 'Nome da categoria', type: 'text', required: true },
      { key: 'grupo_id', label: 'ID do grupo', type: 'number' },
    ],
    emptyItem: { nome_categoria: '', grupo_id: '' },
  },

  marcas: {
    title: 'Marcas',
    endpoint: '/auxiliares/marcas',
    columns: [
      { key: 'id', label: 'ID', mono: true },
      { key: 'marca', label: 'Marca' },
    ],
    fields: [{ key: 'marca', label: 'Nome da marca', type: 'text', required: true }],
    emptyItem: { marca: '' },
  },

  fornecedores: {
    title: 'Fornecedores',
    endpoint: '/auxiliares/fornecedores',
    columns: [
      { key: 'id', label: 'ID', mono: true },
      { key: 'razao_social', label: 'Razão social' },
      { key: 'cnpj', label: 'CNPJ', mono: true },
      { key: 'telefone', label: 'Telefone' },
    ],
    fields: [
      { key: 'razao_social', label: 'Razão social', type: 'text', required: true },
      { key: 'cnpj', label: 'CNPJ', type: 'text', required: true },
      { key: 'telefone', label: 'Telefone', type: 'text' },
      { key: 'email', label: 'E-mail', type: 'email' },
    ],
    emptyItem: { razao_social: '', cnpj: '', telefone: '', email: '' },
  },
};
