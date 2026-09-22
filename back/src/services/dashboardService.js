import db from '../config/db.js';

export const getDashboardSummary = async () => {
  const [
    todosItens,
    equipamentosPorSituacaoRaw,
    manutencoesPorTipoRaw,
    totalEmAberto,
    manutencoesEmAbertoRaw,
    itensRecorrentesRaw,
    predios,
    categorias,
    totalEquipamentos,
    totalManutencoes,
    totalFornecedores,
    totalPredios,
  ] = await Promise.all([
    db.itemManutencao.findMany({
      select: {
        quantidade: true,
        valor_unitario: true,
      },
    }),

    db.equipamento.groupBy({
      by: ['situacao'],
      _count: {
        id: true,
      },
    }),

    db.manutencao.groupBy({
      by: ['tipo_manutencao'],
      _count: {
        id: true,
      },
    }),

    db.manutencao.count({
      where: {
        finalizado: false,
      },
    }),

    db.manutencao.findMany({
      where: {
        finalizado: false,
      },
      take: 5,
      orderBy: {
        data: 'asc',
      },
      select: {
        id: true,
        data: true,
        nota_fiscal: true,
        solicitacao: true,
        tipo_manutencao: true,
      },
    }),

    db.itemManutencao.groupBy({
      by: ['equipamento_id'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    }),

    db.predio.findMany({
      select: {
        nome_predio: true,
        locais: {
          select: {
            equipamentos: {
              select: {
                itens: {
                  select: {
                    quantidade: true,
                    valor_unitario: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

    db.categoria.findMany({
      select: {
        nome_categoria: true,
        equipamentos: {
          select: {
            itens: {
              select: {
                quantidade: true,
                valor_unitario: true,
              },
            },
          },
        },
      },
    }),

    db.equipamento.count(),
    db.manutencao.count(),
    db.fornecedor.count(),
    db.predio.count(),
  ]);

  const gastoTotal = todosItens.reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const unit = Number(item.valor_unitario) || 0;
    return acc + qtd * unit;
  }, 0);

  const idsRecorrentes = itensRecorrentesRaw.map((i) => i.equipamento_id);

  const dadosEquipamentos = idsRecorrentes.length
    ? await db.equipamento.findMany({
        where: {
          id: {
            in: idsRecorrentes,
          },
        },
        include: {
          categoria: true,
          local: {
            include: {
              predio: true,
            },
          },
        },
      })
    : [];

  const topRecorrentes = itensRecorrentesRaw.map((item) => {
    const eq = dadosEquipamentos.find((e) => e.id === item.equipamento_id);
    return {
      equipamentoId: item.equipamento_id,
      patrimonio: eq?.patrimonio || '—',
      categoria: eq?.categoria?.nome_categoria || '—',
      predio: eq?.local?.predio?.nome_predio || '—',
      situacao: eq?.situacao || '—',
      ocorrencias: item._count.id,
    };
  });

  const gastosPorPredio = predios
    .map((p) => {
      const valor = p.locais.reduce((totalLocal, l) => {
        return (
          totalLocal +
          l.equipamentos.reduce((totalEq, eq) => {
            return (
              totalEq +
              eq.itens.reduce((totalItem, it) => {
                const qtd = Number(it.quantidade) || 0;
                const unit = Number(it.valor_unitario) || 0;
                return totalItem + qtd * unit;
              }, 0)
            );
          }, 0)
        );
      }, 0);

      return {
        nome: p.nome_predio,
        valor,
      };
    })
    .filter((p) => p.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const gastosPorCategoria = categorias
    .map((c) => {
      const valor = c.equipamentos.reduce((totalEq, eq) => {
        return (
          totalEq +
          eq.itens.reduce((totalItem, it) => {
            const qtd = Number(it.quantidade) || 0;
            const unit = Number(it.valor_unitario) || 0;
            return totalItem + qtd * unit;
          }, 0)
        );
      }, 0);

      return {
        nome: c.nome_categoria,
        valor,
      };
    })
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  return {
    contadores: {
      equipamentos: totalEquipamentos,
      manutencoes: totalManutencoes,
      fornecedores: totalFornecedores,
      predios: totalPredios,
    },
    gastoTotal,
    gastosPorPredio,
    gastosPorCategoria,
    equipamentosPorSituacao: equipamentosPorSituacaoRaw.map((e) => ({
      nome: e.situacao,
      valor: e._count.id,
    })),
    manutencoesPorTipo: manutencoesPorTipoRaw.map((m) => ({
      nome: m.tipo_manutencao || 'Não informado',
      valor: m._count.id,
    })),
    topRecorrentes,
    totalEmAberto,
    manutencoesEmAberto: manutencoesEmAbertoRaw.map((m) => ({
      id: m.id,
      data: m.data,
      nota_fiscal: m.nota_fiscal,
      solicitacao: m.solicitacao,
      tipo_manutencao: m.tipo_manutencao,
    })),
  };
};
