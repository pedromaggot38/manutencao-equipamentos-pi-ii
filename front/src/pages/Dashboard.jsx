import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const INDICADORES_LABELS = [
  { key: 'equipamentos', label: 'Equipamentos' },
  { key: 'manutencoes', label: 'Manutenções' },
  { key: 'fornecedores', label: 'Fornecedores' },
  { key: 'predios', label: 'Prédios' },
];

const CORES_SITUACAO = {
  Ativo: 'var(--accent-green, #2f7d54)',
  ativo: 'var(--accent-green, #2f7d54)',
  Baixado: 'var(--accent-red, #af3a28)',
  baixado: 'var(--accent-red, #af3a28)',
  'Para Baixa': 'var(--accent-amber, #b96a1f)',
  'para baixa': 'var(--accent-amber, #b96a1f)',
  'Em manutenção': 'var(--accent-amber, #b96a1f)',
  'em manutenção': 'var(--accent-amber, #b96a1f)',
};

const PALETA = [
  '#2f6f8f',
  '#b96a1f',
  '#2f7d54',
  '#af3a28',
  '#6a5acd',
  '#c2a14d',
  '#4a7c96',
  '#8b5e34',
];

function corPara(nome, indice) {
  return CORES_SITUACAO[nome] || PALETA[indice % PALETA.length];
}

function formatarMoeda(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });
}

// Única requisição de dados de toda a tela
async function fetchDashboardSummary() {
  const res = await api.get('/dashboard/summary');
  return res?.data !== undefined ? res.data : res;
}

export default function Dashboard() {
  const { user } = useAuth();

  // Uma única Query gerenciada pelo TanStack Query (5 minutos de cache)
  const {
    data: analytics,
    isLoading: loadingAnalytics,
    error: queryError,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 1000 * 60 * 5,
  });

  const erroAnalytics =
    queryError?.payload?.message ||
    queryError?.response?.data?.message ||
    queryError?.message ||
    '';

  return (
    <Layout title='Visão geral'>
      <div className='panel' style={{ padding: '16px 18px', marginBottom: 20 }}>
        Bem-vindo(a), <strong>{user?.name}</strong>.
      </div>

      {/* Cards de Métricas Principais (alimentados pela mesma requisição) */}
      <div className='stat-grid'>
        {INDICADORES_LABELS.map((ind) => (
          <div className='stat-card' key={ind.key}>
            <div className='stat-card-label'>{ind.label}</div>
            <div className='stat-card-value'>
              {loadingAnalytics
                ? '…'
                : (analytics?.contadores?.[ind.key] ?? '—')}
            </div>
          </div>
        ))}
        <div className='stat-card'>
          <div className='stat-card-label'>Gasto total em manutenções</div>
          <div className='stat-card-value'>
            {loadingAnalytics
              ? '…'
              : analytics
                ? formatarMoeda(analytics.gastoTotal)
                : '—'}
          </div>
        </div>
      </div>

      {loadingAnalytics && (
        <div
          className='panel'
          style={{
            padding: '16px 18px',
            marginBottom: 20,
            color: 'var(--text-muted)',
          }}
        >
          Calculando indicadores…
        </div>
      )}

      {erroAnalytics && (
        <div
          className='panel form-error'
          style={{ padding: '16px 18px', marginBottom: 20 }}
        >
          {erroAnalytics}
        </div>
      )}

      {analytics && (
        <>
          {/* Seção 1 de Gráficos: Gastos por Prédio e Gastos por Categoria */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div className='panel'>
              <div className='panel-header'>
                <h2>Gastos por prédio (top 10)</h2>
              </div>
              <div className='panel-body' style={{ height: 320 }}>
                {!analytics.gastosPorPredio?.length ? (
                  <div className='empty-state'>
                    Sem dados de custos por prédio.
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={analytics.gastosPorPredio}
                      layout='vertical'
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray='3 3'
                        stroke='var(--border)'
                        horizontal={false}
                      />
                      <XAxis
                        type='number'
                        tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                        fontSize={11}
                      />
                      <YAxis
                        type='category'
                        dataKey='nome'
                        width={180}
                        fontSize={11}
                        tickFormatter={(v) =>
                          v && v.length > 25 ? `${v.slice(0, 25)}…` : v || '—'
                        }
                      />
                      <Tooltip formatter={(v) => [formatarMoeda(v), 'Gasto']} />
                      <Bar
                        dataKey='valor'
                        fill='var(--primary, #2f6f8f)'
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className='panel'>
              <div className='panel-header'>
                <h2>Gastos por categoria</h2>
              </div>
              <div className='panel-body' style={{ height: 320 }}>
                {!analytics.gastosPorCategoria?.length ? (
                  <div className='empty-state'>Sem dados de categorias.</div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={analytics.gastosPorCategoria}
                        dataKey='valor'
                        nameKey='nome'
                        cx='50%'
                        cy='48%'
                        outerRadius={90}
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {analytics.gastosPorCategoria.map((entrada, i) => (
                          <Cell
                            key={entrada.nome || i}
                            fill={corPara(entrada.nome, i)}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [formatarMoeda(v), 'Total']} />
                      <Legend
                        layout='horizontal'
                        verticalAlign='bottom'
                        align='center'
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2 de Gráficos: Equipamentos por Situação e Manutenções por Tipo */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div className='panel'>
              <div className='panel-header'>
                <h2>Equipamentos por situação</h2>
              </div>
              <div className='panel-body' style={{ height: 280 }}>
                {!analytics.equipamentosPorSituacao?.length ? (
                  <div className='empty-state'>
                    Nenhum equipamento cadastrado.
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={analytics.equipamentosPorSituacao}
                        dataKey='valor'
                        nameKey='nome'
                        cx='50%'
                        cy='45%'
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={true}
                        fontSize={11}
                      >
                        {analytics.equipamentosPorSituacao.map((entrada, i) => (
                          <Cell
                            key={entrada.nome || i}
                            fill={corPara(entrada.nome, i)}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [v, 'Quantidade']} />
                      <Legend
                        verticalAlign='bottom'
                        align='center'
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className='panel'>
              <div className='panel-header'>
                <h2>Manutenções por tipo</h2>
              </div>
              <div className='panel-body' style={{ height: 280 }}>
                {!analytics.manutencoesPorTipo?.length ? (
                  <div className='empty-state'>
                    Nenhuma manutenção realizada.
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={analytics.manutencoesPorTipo}
                      margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray='3 3'
                        stroke='var(--border)'
                      />
                      <XAxis
                        dataKey='nome'
                        fontSize={11}
                        interval={0}
                        tickFormatter={(v) =>
                          v.length > 15 ? `${v.slice(0, 15)}…` : v
                        }
                      />
                      <YAxis fontSize={11} allowDecimals={false} />
                      <Tooltip formatter={(v) => [v, 'Ocorrências']} />
                      <Bar
                        dataKey='valor'
                        fill='var(--accent-amber, #b96a1f)'
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Tabela: Top Recorrentes */}
          <div className='panel' style={{ marginBottom: 20 }}>
            <div className='panel-header'>
              <h2>
                Equipamentos com mais manutenções (candidatos à preventiva)
              </h2>
            </div>
            {!analytics.topRecorrentes?.length ? (
              <div className='empty-state'>
                Nenhum equipamento com histórico de manutenção ainda.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Patrimônio</th>
                    <th>Categoria</th>
                    <th>Prédio</th>
                    <th>Situação</th>
                    <th>Nº de intervenções</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topRecorrentes.map((eq) => (
                    <tr key={eq.equipamentoId}>
                      <td className='mono'>{eq.patrimonio}</td>
                      <td>{eq.categoria}</td>
                      <td>{eq.predio}</td>
                      <td>
                        <span
                          className={`badge ${
                            eq.situacao?.toLowerCase() === 'baixado'
                              ? 'badge-red'
                              : eq.situacao?.toLowerCase() === 'ativo'
                                ? 'badge-green'
                                : 'badge-amber'
                          }`}
                        >
                          {eq.situacao}
                        </span>
                      </td>
                      <td className='mono'>
                        <strong>{eq.ocorrencias}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Tabela: Manutenções em Aberto */}
          <div className='panel'>
            <div className='panel-header'>
              <h2>Manutenções em aberto ({analytics.totalEmAberto ?? 0})</h2>
            </div>
            {!analytics.manutencoesEmAberto?.length ? (
              <div className='empty-state'>
                Nenhuma manutenção pendente — tudo finalizado.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Nota fiscal</th>
                    <th>Solicitação</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.manutencoesEmAberto.map((m) => (
                    <tr key={m.id}>
                      <td className='mono'>
                        {m.data
                          ? new Date(m.data).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className='mono'>{m.nota_fiscal || '—'}</td>
                      <td className='mono'>#{m.solicitacao || '—'}</td>
                      <td>{m.tipo_manutencao || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {analytics.totalEmAberto >
              (analytics.manutencoesEmAberto?.length ?? 0) && (
              <div
                style={{
                  padding: '10px 18px',
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                }}
              >
                Mostrando as {analytics.manutencoesEmAberto.length} mais antigas
                de {analytics.totalEmAberto} pendentes. Veja a lista completa na
                aba Manutenções.
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
