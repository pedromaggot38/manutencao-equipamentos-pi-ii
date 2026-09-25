import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

const ITEM_VAZIO = {
  descricao: '',
  quantidade: '1',
  valor_unitario: '',
  equipamento_id: '',
};

const LIMIT = 20;

async function fetchManutencoes(page, search, dataInicio, dataFim) {
  const params = new URLSearchParams({ page, limit: LIMIT });
  if (search?.trim()) params.set('search', search.trim());

  if (dataInicio) {
    params.set('data_inicio', `${dataInicio}T00:00:00.000Z`);
  }
  if (dataFim) {
    params.set('data_fim', `${dataFim}T23:59:59.999Z`);
  }

  const res = await api.get(`/manutencoes?${params.toString()}`);
  const payload = res?.data !== undefined ? res.data : res;
  return {
    items: payload?.items ?? (Array.isArray(payload) ? payload : []),
    meta: res?.meta ?? null,
  };
}

// Busca dos auxiliares no select
async function fetchAuxiliar(endpoint) {
  const res = await api.get(`${endpoint}?limit=100`);
  const payload = res?.data !== undefined ? res.data : res;
  return payload?.items ?? (Array.isArray(payload) ? payload : []);
}

export default function Manutencoes() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const podeExcluir = user?.role === 'admin' || user?.role === 'root';
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [termoDigitado, setTermoDigitado] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const temFiltroAtivo =
    buscaAplicada !== '' || dataInicio !== '' || dataFim !== '';

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Estados para o Modal de Exclusão
  const [modalRemoverAberto, setModalRemoverAberto] = useState(false);
  const [manutencaoAlvo, setManutencaoAlvo] = useState(null);

  // 1. Listagem de manutenções com suporte a pesquisa e datas
  const {
    data: respostaManutencoes,
    isLoading: loading,
    error: erroQuery,
  } = useQuery({
    queryKey: ['manutencoes', page, buscaAplicada, dataInicio, dataFim],
    queryFn: () => fetchManutencoes(page, buscaAplicada, dataInicio, dataFim),
    staleTime: 1000 * 30,
  });

  const items = respostaManutencoes?.items ?? [];
  const meta = respostaManutencoes?.meta ?? null;
  const error = erroQuery?.message || '';

  // 2. Auxiliares sob demanda (só buscam quando o modal de criação abre)
  const { data: fornecedores = [] } = useQuery({
    queryKey: ['auxiliares-fornecedores'],
    queryFn: () => fetchAuxiliar('/auxiliares/fornecedores'),
    enabled: modalAberto,
    staleTime: 1000 * 60 * 15,
  });

  const { data: equipamentos = [] } = useQuery({
    queryKey: ['auxiliares-equipamentos-select'],
    queryFn: () => fetchAuxiliar('/equipamentos'),
    enabled: modalAberto,
    staleTime: 1000 * 60 * 15,
  });

  // Mutation de Exclusão
  const excluirMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/manutencoes/${id}`, {
        headers: { 'Content-Type': undefined },
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Manutenção excluída com sucesso!');
      fecharModalRemover();
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-rapidos'] });
    },
    onError: (err) => {
      const mensagem =
        err.response?.data?.message ||
        err.message ||
        'Não foi possível remover a manutenção.';
      toast.error(mensagem);
      fecharModalRemover();
    },
  });

  function irParaPagina(novaPagina) {
    setPage(novaPagina);
  }

  function buscar(e) {
    e.preventDefault();
    setPage(1);
    setBuscaAplicada(termoDigitado);
  }

  function limparFiltros() {
    setTermoDigitado('');
    setBuscaAplicada('');
    setDataInicio('');
    setDataFim('');
    setPage(1);
  }

  function abrirNova() {
    setFormError('');
    setForm({
      data: new Date().toISOString().slice(0, 10),
      nota_fiscal: '',
      solicitacao: '',
      forma_aquisicao: '',
      tipo_manutencao: '',
      observacoes: '',
      fornecedor_id: '',
      itens: [{ ...ITEM_VAZIO }],
    });
    setModalAberto(true);
  }

  function atualizarItem(index, campo, valor) {
    const novosItens = [...form.itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    setForm({ ...form, itens: novosItens });
  }

  function adicionarItem() {
    setForm({ ...form, itens: [...form.itens, { ...ITEM_VAZIO }] });
  }

  function removerItem(index) {
    setForm({ ...form, itens: form.itens.filter((_, i) => i !== index) });
  }

  function abrirModalRemover(item) {
    setManutencaoAlvo(item);
    setModalRemoverAberto(true);
  }

  function fecharModalRemover() {
    setModalRemoverAberto(false);
    setManutencaoAlvo(null);
  }

  function confirmarRemocao() {
    if (!manutencaoAlvo) return;
    excluirMutation.mutate(manutencaoAlvo.id);
  }

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        solicitacao: Number(form.solicitacao),
        fornecedor_id: Number(form.fornecedor_id),
        itens: form.itens.map((it) => ({
          ...it,
          quantidade: Number(it.quantidade),
          valor_unitario: Number(it.valor_unitario),
          equipamento_id: Number(it.equipamento_id),
        })),
      };

      const res = await api.post('/manutencoes', payload);
      setModalAberto(false);
      toast.success(res?.message || 'Manutenção registrada com sucesso!');

      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-rapidos'] });
    } catch (err) {
      const mensagem =
        err.payload?.errors?.[0]?.mensagem ||
        err.response?.data?.message ||
        err.message ||
        'Erro ao salvar manutenção.';
      setFormError(mensagem);
      toast.error(mensagem);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout
      title='Manutenções'
      actions={
        <button className='btn btn-primary' onClick={abrirNova}>
          + Nova manutenção
        </button>
      }
    >
      {/* Barra de Pesquisa e Filtro por Data */}
      <form
        className='toolbar'
        onSubmit={buscar}
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <input
          type='search'
          placeholder='Pesquisar por nota fiscal, forma de aquisição…'
          value={termoDigitado}
          onChange={(e) => setTermoDigitado(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted, #666)' }}>
            De:
          </label>
          <input
            type='date'
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              setPage(1);
            }}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: 'var(--radius, 4px)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input, #fff)',
              color: 'var(--text-main, #333)',
              fontSize: '13.5px',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted, #666)' }}>
            Até:
          </label>
          <input
            type='date'
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              setPage(1);
            }}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: 'var(--radius, 4px)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input, #fff)',
              color: 'var(--text-main, #333)',
              fontSize: '13.5px',
            }}
          />
        </div>

        <button type='submit' className='btn' style={{ height: '38px' }}>
          Filtrar
        </button>

        {temFiltroAtivo && (
          <button
            type='button'
            className='btn'
            onClick={limparFiltros}
            style={{ height: '38px' }}
            title='Limpar filtros e busca'
          >
            Limpar filtros
          </button>
        )}
      </form>

      <div className='panel'>
        <div className='panel-header'>
          <h2>{meta?.total ?? items.length} ordem(ns) de manutenção</h2>
        </div>

        {loading && <div className='empty-state'>Carregando…</div>}
        {!loading && error && <div className='empty-state'>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className='empty-state'>
            Nenhum registro de manutenção encontrado.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nota fiscal</th>
                <th>Solicitação</th>
                <th>Itens</th>
                <th>Status</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className='mono'>
                    {item.data
                      ? new Date(item.data).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className='mono'>{item.nota_fiscal}</td>
                  <td className='mono'>#{item.solicitacao}</td>
                  <td>{item._count?.itens ?? item.qtd_itens ?? '—'}</td>
                  <td>
                    <span
                      className={`badge ${item.finalizado ? 'badge-green' : 'badge-amber'}`}
                    >
                      {item.finalizado ? 'Finalizada' : 'Em andamento'}
                    </span>
                  </td>
                  <td>
                    <div className='table-actions'>
                      <button
                        className='btn btn-sm'
                        onClick={() => navigate(`/manutencoes/${item.id}`)}
                      >
                        Gerenciar
                      </button>
                      {podeExcluir && (
                        <button
                          className='btn btn-sm btn-danger'
                          onClick={() => abrirModalRemover(item)}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && meta && meta.totalPages > 1 && (
          <div className='pagination'>
            <span>
              Mostrando {meta.from}–{meta.to} de {meta.total}
            </span>
            <button
              className='btn btn-sm'
              disabled={!meta.hasPrevPage}
              onClick={() => irParaPagina(page - 1)}
            >
              ← Anterior
            </button>
            <span>
              Página {meta.page} de {meta.totalPages}
            </span>
            <button
              className='btn btn-sm'
              disabled={!meta.hasNextPage}
              onClick={() => irParaPagina(page + 1)}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {/* Modal: Nova Manutenção */}
      {modalAberto && (
        <Modal
          title='Nova manutenção'
          onClose={() => setModalAberto(false)}
          footer={
            <>
              <button className='btn' onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button
                className='btn btn-primary'
                onClick={salvar}
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <form onSubmit={salvar}>
            {formError && <div className='form-error'>{formError}</div>}

            <div className='field-row'>
              <div className='field'>
                <label htmlFor='data'>Data</label>
                <input
                  id='data'
                  type='date'
                  required
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div className='field'>
                <label htmlFor='nota_fiscal'>Nota fiscal</label>
                <input
                  id='nota_fiscal'
                  required
                  value={form.nota_fiscal}
                  onChange={(e) =>
                    setForm({ ...form, nota_fiscal: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='field-row'>
              <div className='field'>
                <label htmlFor='solicitacao'>Nº de solicitação</label>
                <input
                  id='solicitacao'
                  type='number'
                  required
                  value={form.solicitacao}
                  onChange={(e) =>
                    setForm({ ...form, solicitacao: e.target.value })
                  }
                />
              </div>
              <div className='field'>
                <label htmlFor='fornecedor_id'>Fornecedor</label>
                <select
                  id='fornecedor_id'
                  required
                  value={form.fornecedor_id}
                  onChange={(e) =>
                    setForm({ ...form, fornecedor_id: e.target.value })
                  }
                >
                  <option value=''>Selecione…</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.razao_social}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='field-row'>
              <div className='field'>
                <label htmlFor='forma_aquisicao'>Forma de aquisição</label>
                <input
                  id='forma_aquisicao'
                  value={form.forma_aquisicao}
                  onChange={(e) =>
                    setForm({ ...form, forma_aquisicao: e.target.value })
                  }
                />
              </div>
              <div className='field'>
                <label htmlFor='tipo_manutencao'>Tipo de manutenção</label>
                <input
                  id='tipo_manutencao'
                  placeholder='preventiva, corretiva…'
                  value={form.tipo_manutencao}
                  onChange={(e) =>
                    setForm({ ...form, tipo_manutencao: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='field'>
              <label htmlFor='observacoes'>Observações</label>
              <textarea
                id='observacoes'
                rows={2}
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
              />
            </div>

            <div className='field'>
              <label>Itens da manutenção</label>
              {form.itens.map((it, index) => (
                <div
                  key={index}
                  className='panel'
                  style={{ padding: 10, marginBottom: 8 }}
                >
                  <div className='field'>
                    <label>Descrição do serviço</label>
                    <input
                      required
                      value={it.descricao}
                      onChange={(e) =>
                        atualizarItem(index, 'descricao', e.target.value)
                      }
                    />
                  </div>
                  <div className='field'>
                    <label>Equipamento</label>
                    <select
                      required
                      value={it.equipamento_id}
                      onChange={(e) =>
                        atualizarItem(index, 'equipamento_id', e.target.value)
                      }
                    >
                      <option value=''>Selecione…</option>
                      {equipamentos.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.patrimonio} {eq.tipo ? `· ${eq.tipo}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='field-row'>
                    <div className='field'>
                      <label>Quantidade</label>
                      <input
                        type='number'
                        step='0.01'
                        required
                        value={it.quantidade}
                        onChange={(e) =>
                          atualizarItem(index, 'quantidade', e.target.value)
                        }
                      />
                    </div>
                    <div className='field'>
                      <label>Valor unitário (R$)</label>
                      <input
                        type='number'
                        step='0.01'
                        required
                        value={it.valor_unitario}
                        onChange={(e) =>
                          atualizarItem(index, 'valor_unitario', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  {form.itens.length > 1 && (
                    <button
                      type='button'
                      className='btn btn-sm btn-danger'
                      onClick={() => removerItem(index)}
                    >
                      Remover item
                    </button>
                  )}
                </div>
              ))}
              <button
                type='button'
                className='btn btn-sm'
                onClick={adicionarItem}
              >
                + Adicionar item
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Confirmação de Exclusão da Manutenção */}
      {modalRemoverAberto && (
        <Modal title='Excluir manutenção' onClose={fecharModalRemover}>
          <p style={{ marginBottom: 20, color: 'var(--text-main, #333)' }}>
            Tem certeza de que deseja remover a manutenção com solicitação{' '}
            <strong>#{manutencaoAlvo?.solicitacao}</strong> (NF:{' '}
            {manutencaoAlvo?.nota_fiscal}) e todos os seus itens associados?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type='button' className='btn' onClick={fecharModalRemover}>
              Cancelar
            </button>
            <button
              type='button'
              className='btn btn-danger'
              onClick={confirmarRemocao}
              disabled={excluirMutation.isPending}
            >
              {excluirMutation.isPending ? 'A remover…' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
