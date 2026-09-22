import { api } from '../api/client';

// Busca uma lista completa, paginando automaticamente. Usamos um limite
// conservador por página porque a API rejeita valores de "limit" muito altos
// (validação de schema no backend).
const LIMIT_SEGURO = 100;

export async function buscarTudo(endpoint, limitPorPagina = LIMIT_SEGURO) {
  let pagina = 1;
  let todos = [];
  // Limite de segurança para nunca entrar num loop infinito por engano.
  for (let tentativas = 0; tentativas < 200; tentativas++) {
    const json = await api.get(`${endpoint}?page=${pagina}&limit=${limitPorPagina}`);
    const lista = json?.data?.items ?? json?.data ?? [];
    todos = todos.concat(Array.isArray(lista) ? lista : []);
    const meta = json?.meta;
    if (!meta || !meta.hasNextPage) break;
    pagina += 1;
  }
  return todos;
}

// Executa promessas em lotes, para não disparar 117+ requisições simultâneas.
async function emLotes(itens, tamanhoDoLote, tarefa) {
  const resultados = [];
  for (let i = 0; i < itens.length; i += tamanhoDoLote) {
    const lote = itens.slice(i, i + tamanhoDoLote);
    const parciais = await Promise.all(lote.map(tarefa));
    resultados.push(...parciais);
  }
  return resultados;
}

export async function carregarDadosAnalytics(onProgresso) {
  onProgresso?.('Carregando equipamentos…');
  const equipamentos = await buscarTudo('/equipamentos');

  onProgresso?.('Carregando manutenções…');
  const manutencoes = await buscarTudo('/manutencoes');

  // Mapa rápido: equipamento_id -> { categoria, predio, situacao }
  const mapaEquipamentos = new Map();
  for (const eq of equipamentos) {
    mapaEquipamentos.set(eq.id, {
      categoria: eq.categoria?.nome_categoria ?? 'Sem categoria',
      predio: eq.local?.predio?.nome_predio ?? 'Sem prédio',
      situacao: eq.situacao ?? 'Não informado',
      patrimonio: eq.patrimonio,
    });
  }

  onProgresso?.(`Carregando itens de ${manutencoes.length} manutenções…`);
  const listasDeItens = await emLotes(manutencoes, 8, async (m) => {
    try {
      const itens = await buscarTudo(`/manutencoes/${m.id}/itens`);
      return { manutencao: m, itens };
    } catch {
      return { manutencao: m, itens: [] };
    }
  });

  // --- Agregações ---
  const gastosPorPredio = new Map();
  const gastosPorCategoria = new Map();
  const contagemPorEquipamento = new Map(); // equipamento_id -> nº de itens de manutenção (recorrência)

  for (const { itens } of listasDeItens) {
    for (const item of itens) {
      const valor = Number(item.valor_unitario) * Number(item.quantidade);
      const info = mapaEquipamentos.get(item.equipamento_id);

      const predio = info?.predio ?? 'Sem prédio';
      gastosPorPredio.set(predio, (gastosPorPredio.get(predio) ?? 0) + valor);

      const categoria = info?.categoria ?? 'Sem categoria';
      gastosPorCategoria.set(categoria, (gastosPorCategoria.get(categoria) ?? 0) + valor);

      contagemPorEquipamento.set(
        item.equipamento_id,
        (contagemPorEquipamento.get(item.equipamento_id) ?? 0) + 1
      );
    }
  }

  const equipamentosPorSituacao = new Map();
  for (const eq of equipamentos) {
    const situacao = eq.situacao ?? 'Não informado';
    equipamentosPorSituacao.set(situacao, (equipamentosPorSituacao.get(situacao) ?? 0) + 1);
  }

  const manutencoesPorTipo = new Map();
  for (const m of manutencoes) {
    const tipo = m.tipo_manutencao?.trim() || 'Não informado';
    manutencoesPorTipo.set(tipo, (manutencoesPorTipo.get(tipo) ?? 0) + 1);
  }

  const topRecorrentes = [...contagemPorEquipamento.entries()]
    .map(([equipamentoId, ocorrencias]) => ({
      equipamentoId,
      ocorrencias,
      ...mapaEquipamentos.get(equipamentoId),
    }))
    .filter((e) => e.patrimonio) // descarta ids sem correspondência
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 10);

  const manutencoesEmAberto = manutencoes
    .filter((m) => !m.finalizado)
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const paraArray = (mapa) =>
    [...mapa.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);

  return {
    totalEquipamentos: equipamentos.length,
    totalManutencoes: manutencoes.length,
    totalItens: listasDeItens.reduce((acc, l) => acc + l.itens.length, 0),
    gastoTotal: [...gastosPorPredio.values()].reduce((a, b) => a + b, 0),
    gastosPorPredio: paraArray(gastosPorPredio).slice(0, 10),
    gastosPorCategoria: paraArray(gastosPorCategoria),
    equipamentosPorSituacao: paraArray(equipamentosPorSituacao),
    manutencoesPorTipo: paraArray(manutencoesPorTipo),
    topRecorrentes,
    manutencoesEmAberto,
  };
}
