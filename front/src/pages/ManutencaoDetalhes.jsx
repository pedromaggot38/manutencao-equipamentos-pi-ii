import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const ITEM_PADRAO = {
  descricao: '',
  quantidade: 1,
  valor_unitario: '',
  equipamento_id: '',
};

async function fetchAuxiliar(endpoint) {
  const res = await api.get(`${endpoint}?limit=100`);
  const payload = res?.data !== undefined ? res.data : res;
  return payload?.items ?? (Array.isArray(payload) ? payload : []);
}

export default function ManutencaoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const podeExcluir = user?.role === 'admin' || user?.role === 'root';

  const [modalEditarManutencaoAberto, setModalEditarManutencaoAberto] =
    useState(false);
  const [formManutencao, setFormManutencao] = useState(null);

  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [formItem, setFormItem] = useState(ITEM_PADRAO);

  const [modalRemoverItemAberto, setModalRemoverItemAberto] = useState(false);
  const [itemAlvoRemocao, setItemAlvoRemocao] = useState(null);

  // 1. Busca dados da ordem de manutenção (Master)
  const {
    data: respostaManutencao,
    isLoading: loadingManutencao,
    error: errorManutencao,
  } = useQuery({
    queryKey: ['manutencao', id],
    queryFn: async () => {
      return await api.get(`/manutencoes/${id}`);
    },
    enabled: Boolean(id),
  });

  // O api client já extrai res.data, logo respostaManutencao é o corpo retornado pelo resfc
  const manutencao = respostaManutencao?.data ?? respostaManutencao;

  // 2. Busca itens da manutenção (Detail)
  const { data: respostaItens, isLoading: loadingItens } = useQuery({
    queryKey: ['manutencao-itens', id],
    queryFn: async () => {
      return await api.get(`/manutencoes/${id}/itens?limit=100`);
    },
    enabled: Boolean(id),
  });

  const payloadItens = respostaItens?.data ?? respostaItens;
  const itens = Array.isArray(payloadItens?.items)
    ? payloadItens.items
    : Array.isArray(payloadItens)
      ? payloadItens
      : [];

  // 3. Auxiliares
  const { data: fornecedores = [] } = useQuery({
    queryKey: ['auxiliares-fornecedores'],
    queryFn: () => fetchAuxiliar('/auxiliares/fornecedores'),
    staleTime: 1000 * 60 * 15,
  });

  const { data: equipamentos = [] } = useQuery({
    queryKey: ['auxiliares-equipamentos-select'],
    queryFn: () => fetchAuxiliar('/equipamentos'),
    staleTime: 1000 * 60 * 15,
  });

  function sincronizarFormulario(dados) {
    if (!dados) return;
    setFormManutencao({
      data: dados.data ? String(dados.data).slice(0, 10) : '',
      nota_fiscal: dados.nota_fiscal ?? '',
      solicitacao: dados.solicitacao ?? '',
      forma_aquisicao: dados.forma_aquisicao ?? '',
      tipo_manutencao: dados.tipo_manutencao ?? '',
      observacoes: dados.observacoes ?? '',
      fornecedor_id: dados.fornecedor_id ?? '',
      finalizado: Boolean(dados.finalizado),
    });
  }

  useEffect(() => {
    if (manutencao?.id) {
      sincronizarFormulario(manutencao);
    }
  }, [manutencao]);

  function abrirModalEdicaoManutencao() {
    sincronizarFormulario(manutencao);
    setModalEditarManutencaoAberto(true);
  }

  // Mutation: Salvar dados da manutenção
  const salvarManutencaoMutation = useMutation({
    mutationFn: async (dados) => {
      const payload = {
        data: dados.data ? dados.data.slice(0, 10) : undefined,
        nota_fiscal: dados.nota_fiscal,
        solicitacao: Number(dados.solicitacao),
        finalizado: Boolean(dados.finalizado),
        forma_aquisicao: dados.forma_aquisicao || null,
        tipo_manutencao: dados.tipo_manutencao || null,
        observacoes: dados.observacoes || null,
        fornecedor_id: Number(dados.fornecedor_id),
      };

      return await api.patch(`/manutencoes/${id}`, payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['manutencao', id] });
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success(res?.message || 'Dados da manutenção atualizados!');
      setModalEditarManutencaoAberto(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Erro ao atualizar manutenção.',
      );
    },
  });

  // Mutation: Salvar Item (Criar ou Editar)
  const salvarItemMutation = useMutation({
    mutationFn: async ({ itemId, dados }) => {
      const payload = {
        descricao: dados.descricao.trim(),
        quantidade: parseFloat(dados.quantidade),
        valor_unitario: parseFloat(dados.valor_unitario),
        equipamento_id: Number(dados.equipamento_id),
      };

      if (itemId) {
        return await api.patch(`/manutencoes/${id}/itens/${itemId}`, payload);
      }
      return await api.post(`/manutencoes/${id}/itens`, payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['manutencao-itens', id] });
      queryClient.invalidateQueries({ queryKey: ['manutencao', id] });
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success(
        res?.message ||
          (itemEmEdicao
            ? 'Item atualizado com sucesso!'
            : 'Item adicionado com sucesso!'),
      );
      fecharModalItem();
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Erro ao salvar item da manutenção.',
      );
    },
  });

  // Mutation: Remover Item
  const removerItemMutation = useMutation({
    mutationFn: async (itemId) => {
      return await api.delete(`/manutencoes/${id}/itens/${itemId}`);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['manutencao-itens', id] });
      queryClient.invalidateQueries({ queryKey: ['manutencao', id] });
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success(res?.message || 'Item removido com sucesso.');
      fecharModalRemoverItem();
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Não foi possível remover o item.',
      );
      fecharModalRemoverItem();
    },
  });

  function abrirNovoItem() {
    setItemEmEdicao(null);
    setFormItem(ITEM_PADRAO);
    setModalItemAberto(true);
  }

  function abrirEdicaoItem(item) {
    setItemEmEdicao(item);
    setFormItem({
      descricao: item.descricao ?? '',
      quantidade: item.quantidade ?? 1,
      valor_unitario: item.valor_unitario ?? '',
      equipamento_id: item.equipamento_id ?? '',
    });
    setModalItemAberto(true);
  }

  function fecharModalItem() {
    setModalItemAberto(false);
    setItemEmEdicao(null);
    setFormItem(ITEM_PADRAO);
  }

  function handleSubmitItem(e) {
    e.preventDefault();
    salvarItemMutation.mutate({ itemId: itemEmEdicao?.id, dados: formItem });
  }

  function abrirModalRemoverItem(item) {
    setItemAlvoRemocao(item);
    setModalRemoverItemAberto(true);
  }

  function fecharModalRemoverItem() {
    setModalRemoverItemAberto(false);
    setItemAlvoRemocao(null);
  }

  function confirmarRemocaoItem() {
    if (!itemAlvoRemocao) return;
    removerItemMutation.mutate(itemAlvoRemocao.id);
  }

  const valorTotalGeral = itens.reduce(
    (acc, it) =>
      acc + Number(it.quantidade || 0) * Number(it.valor_unitario || 0),
    0,
  );

  // Estados de Carregamento e Erro
  if (loadingManutencao) {
    return (
      <Layout title='Carregando manutenção…'>
        <div className='panel'>
          <div className='empty-state'>Carregando dados da manutenção…</div>
        </div>
      </Layout>
    );
  }

  if (errorManutencao || !manutencao?.id) {
    return (
      <Layout title='Erro'>
        <div className='panel'>
          <div className='empty-state'>
            {errorManutencao?.message ||
              'Não foi possível encontrar esta manutenção.'}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className='btn' onClick={() => navigate('/manutencoes')}>
              Voltar para listagem
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Manutenção #${manutencao.solicitacao || id} — NF ${manutencao.nota_fiscal || ''}`}
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <button className='btn' onClick={() => navigate('/manutencoes')}>
            ← Voltar para listagem
          </button>
          <button
            className='btn btn-primary'
            onClick={abrirModalEdicaoManutencao}
          >
            Editar dados da manutenção
          </button>
        </div>
      }
    >
      {/* 1. Painel de Resumo da Manutenção */}
      <div className='panel' style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 10,
          }}
        >
          <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Dados Gerais</h2>
          <span
            className={`badge ${manutencao.finalizado ? 'badge-green' : 'badge-amber'}`}
          >
            {manutencao.finalizado ? 'Finalizada' : 'Em andamento'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            fontSize: '13.5px',
          }}
        >
          <div>
            <span
              style={{ color: 'var(--text-muted, #777)', display: 'block' }}
            >
              Data:
            </span>
            <strong>
              {manutencao.data
                ? new Date(manutencao.data).toLocaleDateString('pt-BR')
                : '—'}
            </strong>
          </div>
          <div>
            <span
              style={{ color: 'var(--text-muted, #777)', display: 'block' }}
            >
              Nota Fiscal:
            </span>
            <strong className='mono'>{manutencao.nota_fiscal || '—'}</strong>
          </div>
          <div>
            <span
              style={{ color: 'var(--text-muted, #777)', display: 'block' }}
            >
              Nº Solicitação:
            </span>
            <strong className='mono'>#{manutencao.solicitacao || '—'}</strong>
          </div>
          <div>
            <span
              style={{ color: 'var(--text-muted, #777)', display: 'block' }}
            >
              Fornecedor:
            </span>
            <strong>{manutencao.fornecedor?.razao_social || '—'}</strong>
          </div>
          <div>
            <span
              style={{ color: 'var(--text-muted, #777)', display: 'block' }}
            >
              Tipo de Manutenção:
            </span>
            <strong>{manutencao.tipo_manutencao || '—'}</strong>
          </div>
          <div>
            <span
              style={{ color: 'var(--text-muted, #777)', display: 'block' }}
            >
              Forma de Aquisição:
            </span>
            <strong>{manutencao.forma_aquisicao || '—'}</strong>
          </div>
        </div>

        {manutencao.observacoes && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px dashed var(--border)',
            }}
          >
            <span
              style={{
                color: 'var(--text-muted, #777)',
                display: 'block',
                fontSize: '13px',
              }}
            >
              Observações:
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              {manutencao.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* 2. Gerenciamento de Itens */}
      <div className='panel'>
        <div
          className='panel-header'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Itens da Manutenção ({itens.length})</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Card com o Total Geral */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 'var(--radius, 6px)',
                background: 'var(--bg-hover, rgba(0, 0, 0, 0.04))',
                border: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted, #777)',
                }}
              >
                Total Geral:
              </span>
              <span
                className='mono'
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-main, #111)',
                }}
              >
                {valorTotalGeral.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <button className='btn btn-primary' onClick={abrirNovoItem}>
              + Adicionar Item
            </button>
          </div>
        </div>

        {loadingItens && <div className='empty-state'>Carregando itens…</div>}
        {!loadingItens && itens.length === 0 && (
          <div className='empty-state'>
            Nenhum item adicionado a esta manutenção ainda.
          </div>
        )}

        {!loadingItens && itens.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Descrição do Serviço / Peça</th>
                <th>Equipamento (Patrimônio)</th>
                <th>Qtd.</th>
                <th>Valor Unitário</th>
                <th>Subtotal</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((it) => {
                const eq =
                  it.equipamento ??
                  equipamentos.find((e) => e.id === it.equipamento_id);
                const subtotal =
                  Number(it.quantidade) * Number(it.valor_unitario);

                return (
                  <tr key={it.id}>
                    <td>{it.descricao}</td>
                    <td>
                      {eq ? (
                        <>
                          <span className='mono'>{eq.patrimonio}</span>
                          {eq.tipo || eq.modelo ? (
                            <span style={{ color: 'var(--text-muted, #666)' }}>
                              {' '}
                              · {eq.tipo || eq.modelo}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        `#${it.equipamento_id}`
                      )}
                    </td>
                    <td className='mono'>{it.quantidade}</td>
                    <td className='mono'>
                      {Number(it.valor_unitario).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className='mono' style={{ fontWeight: 600 }}>
                      {subtotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td>
                      <div className='table-actions'>
                        <button
                          type='button'
                          className='btn btn-sm'
                          onClick={() => abrirEdicaoItem(it)}
                        >
                          Editar
                        </button>
                        {podeExcluir && (
                          <button
                            type='button'
                            className='btn btn-sm btn-danger'
                            onClick={() => abrirModalRemoverItem(it)}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Editar Dados da Manutenção */}
      {modalEditarManutencaoAberto && formManutencao && (
        <Modal
          title={`Editar Manutenção #${formManutencao.solicitacao || id}`}
          onClose={() => setModalEditarManutencaoAberto(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvarManutencaoMutation.mutate(formManutencao);
            }}
          >
            <div
              className='field-row'
              style={{ display: 'flex', gap: 12, marginBottom: 14 }}
            >
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-data'>Data</label>
                <input
                  id='edit-data'
                  type='date'
                  required
                  value={formManutencao.data}
                  onChange={(e) =>
                    setFormManutencao({
                      ...formManutencao,
                      data: e.target.value,
                    })
                  }
                />
              </div>
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-nota_fiscal'>Nota Fiscal</label>
                <input
                  id='edit-nota_fiscal'
                  required
                  value={formManutencao.nota_fiscal}
                  onChange={(e) =>
                    setFormManutencao({
                      ...formManutencao,
                      nota_fiscal: e.target.value,
                    })
                  }
                />
              </div>
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-solicitacao'>Nº Solicitação</label>
                <input
                  id='edit-solicitacao'
                  type='number'
                  required
                  value={formManutencao.solicitacao}
                  onChange={(e) =>
                    setFormManutencao({
                      ...formManutencao,
                      solicitacao: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div
              className='field-row'
              style={{ display: 'flex', gap: 12, marginBottom: 14 }}
            >
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-fornecedor_id'>Fornecedor</label>
                <select
                  id='edit-fornecedor_id'
                  required
                  value={formManutencao.fornecedor_id}
                  onChange={(e) =>
                    setFormManutencao({
                      ...formManutencao,
                      fornecedor_id: e.target.value,
                    })
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
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-tipo_manutencao'>Tipo de Manutenção</label>
                <input
                  id='edit-tipo_manutencao'
                  placeholder='Ex: Preventiva, Corretiva…'
                  value={formManutencao.tipo_manutencao}
                  onChange={(e) =>
                    setFormManutencao({
                      ...formManutencao,
                      tipo_manutencao: e.target.value,
                    })
                  }
                />
              </div>
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-forma_aquisicao'>Forma de Aquisição</label>
                <input
                  id='edit-forma_aquisicao'
                  placeholder='Ex: Pregão Eletrônico…'
                  value={formManutencao.forma_aquisicao}
                  onChange={(e) =>
                    setFormManutencao({
                      ...formManutencao,
                      forma_aquisicao: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='edit-observacoes'>Observações</label>
              <textarea
                id='edit-observacoes'
                rows={2}
                value={formManutencao.observacoes}
                onChange={(e) =>
                  setFormManutencao({
                    ...formManutencao,
                    observacoes: e.target.value,
                  })
                }
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <input
                  type='checkbox'
                  checked={formManutencao.finalizado}
                  onChange={(e) =>
                    setFormManutencao({
                      ...formManutencao,
                      finalizado: e.target.checked,
                    })
                  }
                />
                Marcar manutenção como finalizada
              </label>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}
            >
              <button
                type='button'
                className='btn'
                onClick={() => setModalEditarManutencaoAberto(false)}
              >
                Cancelar
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={salvarManutencaoMutation.isPending}
              >
                {salvarManutencaoMutation.isPending
                  ? 'Salvando…'
                  : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Adicionar / Editar Item */}
      {modalItemAberto && (
        <Modal
          title={itemEmEdicao ? 'Editar item' : 'Novo item'}
          onClose={fecharModalItem}
        >
          <form onSubmit={handleSubmitItem}>
            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='item-descricao'>
                Descrição do serviço / peça
              </label>
              <input
                id='item-descricao'
                required
                value={formItem.descricao}
                onChange={(e) =>
                  setFormItem({ ...formItem, descricao: e.target.value })
                }
              />
            </div>

            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='item-equipamento'>Equipamento</label>
              <select
                id='item-equipamento'
                required
                value={formItem.equipamento_id}
                onChange={(e) =>
                  setFormItem({ ...formItem, equipamento_id: e.target.value })
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

            <div
              className='field-row'
              style={{ display: 'flex', gap: 12, marginBottom: 20 }}
            >
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='item-quantidade'>Quantidade</label>
                <input
                  id='item-quantidade'
                  type='number'
                  step='0.01'
                  min='0.01'
                  required
                  value={formItem.quantidade}
                  onChange={(e) =>
                    setFormItem({ ...formItem, quantidade: e.target.value })
                  }
                />
              </div>

              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='item-valor'>Valor unitário (R$)</label>
                <input
                  id='item-valor'
                  type='number'
                  step='0.01'
                  min='0'
                  required
                  value={formItem.valor_unitario}
                  onChange={(e) =>
                    setFormItem({ ...formItem, valor_unitario: e.target.value })
                  }
                />
              </div>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}
            >
              <button className='btn' type='button' onClick={fecharModalItem}>
                Cancelar
              </button>
              <button
                className='btn btn-primary'
                type='submit'
                disabled={salvarItemMutation.isPending}
              >
                {salvarItemMutation.isPending ? 'Salvando…' : 'Salvar Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Confirmação de Exclusão de Item */}
      {modalRemoverItemAberto && (
        <Modal title='Excluir item' onClose={fecharModalRemoverItem}>
          <p style={{ marginBottom: 20, color: 'var(--text-main, #333)' }}>
            Tem certeza de que deseja remover o item{' '}
            <strong>"{itemAlvoRemocao?.descricao}"</strong> desta manutenção?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type='button'
              className='btn'
              onClick={fecharModalRemoverItem}
            >
              Cancelar
            </button>
            <button
              type='button'
              className='btn btn-danger'
              onClick={confirmarRemocaoItem}
              disabled={removerItemMutation.isPending}
            >
              {removerItemMutation.isPending ? 'A remover…' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
