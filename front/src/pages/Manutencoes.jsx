import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const ITEM_VAZIO = {
  descricao: '',
  quantidade: '1',
  valor_unitario: '',
  equipamento_id: '',
};

const LIMIT = 20;

// Busca principal das manutenções
async function fetchManutencoes(page) {
  const res = await api.get(`/manutencoes?page=${page}&limit=${LIMIT}`);
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
  const { user } = useAuth();
  const podeExcluir = user?.role === 'admin' || user?.role === 'root';
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [detalhe, setDetalhe] = useState(null);
  const [detalheItens, setDetalheItens] = useState([]);
  const [detalheLoading, setDetalheLoading] = useState(false);

  // 1. Listagem de manutenções com cache de 30s
  const {
    data: respostaManutencoes,
    isLoading: loading,
    error: erroQuery,
  } = useQuery({
    queryKey: ['manutencoes', page],
    queryFn: () => fetchManutencoes(page),
    staleTime: 1000 * 30,
  });

  const items = respostaManutencoes?.items ?? [];
  const meta = respostaManutencoes?.meta ?? null;
  const error = erroQuery?.message || '';

  // 2. Auxiliares sob demanda (só buscam quando o modal abre)
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

  function irParaPagina(novaPagina) {
    setPage(novaPagina);
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

      // Sincroniza listagem e indicadores
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

  async function excluir(item) {
    if (!window.confirm('Remover esta manutenção e todos os seus itens?'))
      return;
    try {
      const res = await api.delete(`/manutencoes/${item.id}`, {
        headers: { 'Content-Type': undefined },
      });

      toast.success(res?.message || 'Manutenção excluída com sucesso!');

      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-rapidos'] });
    } catch (err) {
      const mensagem =
        err.response?.data?.message ||
        err.message ||
        'Não foi possível remover a manutenção.';
      toast.error(mensagem);
    }
  }

  async function abrirDetalhe(item) {
    setDetalhe(item);
    setDetalheLoading(true);
    try {
      const res = await api.get(`/manutencoes/${item.id}/itens`);
      const payload = res?.data !== undefined ? res.data : res;
      setDetalheItens(
        payload?.items ?? (Array.isArray(payload) ? payload : []),
      );
    } catch {
      setDetalheItens([]);
    } finally {
      setDetalheLoading(false);
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
      <div className='panel'>
        <div className='panel-header'>
          <h2>{meta?.total ?? items.length} ordem(ns) de manutenção</h2>
        </div>

        {loading && <div className='empty-state'>Carregando…</div>}
        {!loading && error && <div className='empty-state'>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className='empty-state'>
            Nenhuma manutenção cadastrada ainda.
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
                        onClick={() => abrirDetalhe(item)}
                      >
                        Ver itens
                      </button>
                      {podeExcluir && (
                        <button
                          className='btn btn-sm btn-danger'
                          onClick={() => excluir(item)}
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

      {/* Modal: nova manutenção com itens */}
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

      {/* Modal: visualizar itens de uma manutenção existente */}
      {detalhe && (
        <Modal
          title={`Itens — NF ${detalhe.nota_fiscal}`}
          onClose={() => setDetalhe(null)}
        >
          {detalheLoading && <div className='empty-state'>Carregando…</div>}
          {!detalheLoading && detalheItens.length === 0 && (
            <div className='empty-state'>Nenhum item cadastrado.</div>
          )}
          {!detalheLoading && detalheItens.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Qtd.</th>
                  <th>Valor unit.</th>
                </tr>
              </thead>
              <tbody>
                {detalheItens.map((it) => (
                  <tr key={it.id}>
                    <td>{it.descricao}</td>
                    <td className='mono'>{it.quantidade}</td>
                    <td className='mono'>
                      {Number(it.valor_unitario).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
    </Layout>
  );
}
