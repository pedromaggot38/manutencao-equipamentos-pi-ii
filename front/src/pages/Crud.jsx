import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout.jsx';
import Modal from '../components/Modal.jsx';

const LIMIT = 20;

async function fetchCrudData(endpoint, page, search) {
  const params = new URLSearchParams({ page, limit: LIMIT });
  if (search?.trim()) params.set('search', search.trim());

  const res = await api.get(`${endpoint}?${params.toString()}`);
  const payload = res?.data !== undefined ? res.data : res;
  return {
    items: payload?.items ?? (Array.isArray(payload) ? payload : []),
    meta: res?.meta ?? null,
  };
}

export default function CrudPage({ config }) {
  const { user } = useAuth();
  const podeExcluir = user?.role === 'admin' || user?.role === 'root';
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [termoDigitado, setTermoDigitado] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');

  const [modalItem, setModalItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Estados para o Modal de Exclusão
  const [modalRemoverAberto, setModalRemoverAberto] = useState(false);
  const [itemAlvo, setItemAlvo] = useState(null);

  // Limpa a pesquisa e volta para a página 1 sempre que o endpoint/rota mudar
  useEffect(() => {
    setPage(1);
    setTermoDigitado('');
    setBuscaAplicada('');
  }, [config.endpoint]);

  const temFiltroAtivo = termoDigitado.trim() !== '' || buscaAplicada !== '';

  const {
    data: respostaCrud,
    isLoading: loading,
    error: erroQuery,
  } = useQuery({
    queryKey: ['crud-page', config.endpoint, page, buscaAplicada],
    queryFn: () => fetchCrudData(config.endpoint, page, buscaAplicada),
    staleTime: 1000 * 60 * 10,
  });

  const items = respostaCrud?.items ?? [];
  const meta = respostaCrud?.meta ?? null;
  const error = erroQuery?.message || '';

  // Mutation de Exclusão
  const excluirMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`${config.endpoint}/${id}`, {
        headers: { 'Content-Type': undefined },
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Registro excluído com sucesso!');
      fecharModalRemover();

      queryClient.invalidateQueries({
        queryKey: ['crud-page', config.endpoint],
      });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-locais'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-marcas'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-categorias'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-rapidos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => {
      const mensagem =
        err.response?.data?.message ||
        err.message ||
        'Não foi possível remover o registro.';
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

  function limparBusca() {
    setTermoDigitado('');
    setBuscaAplicada('');
    setPage(1);
  }

  function abrirNovo() {
    setFormError('');
    setModalItem({ ...config.emptyItem });
  }

  function abrirEdicao(item) {
    setFormError('');
    setModalItem({ ...item });
  }

  function abrirModalRemover(item) {
    setItemAlvo(item);
    setModalRemoverAberto(true);
  }

  function fecharModalRemover() {
    setModalRemoverAberto(false);
    setItemAlvo(null);
  }

  function confirmarRemocao() {
    if (!itemAlvo) return;
    excluirMutation.mutate(itemAlvo.id);
  }

  // Tenta obter o nome/identificador amigável do registro para o texto de confirmação
  function getIdentificadorItem(item) {
    if (!item) return '';
    return (
      item.nome ||
      item.nome_categoria ||
      item.marca ||
      item.nome_local ||
      item.nome_predio ||
      item.razao_social ||
      item.descricao ||
      `#${item.id}`
    );
  }

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const isEdicao = Boolean(modalItem.id);
      const payload = { ...modalItem };
      delete payload.id;

      let res;
      if (isEdicao) {
        res = await api.patch(`${config.endpoint}/${modalItem.id}`, payload);
      } else {
        res = await api.post(config.endpoint, payload);
      }

      setModalItem(null);
      toast.success(res?.message || 'Registro salvo com sucesso!');

      queryClient.invalidateQueries({
        queryKey: ['crud-page', config.endpoint],
      });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-locais'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-marcas'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-categorias'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliares-fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-rapidos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    } catch (err) {
      const mensagem =
        err.payload?.errors?.[0]?.mensagem ||
        err.response?.data?.message ||
        err.message ||
        'Erro ao salvar registro.';

      setFormError(mensagem);
      toast.error(mensagem);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout
      title={config.title}
      actions={
        <button className='btn btn-primary' onClick={abrirNovo}>
          + Novo
        </button>
      }
    >
      <form
        className='toolbar'
        onSubmit={buscar}
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <input
          type='search'
          placeholder='Pesquisar registros…'
          value={termoDigitado}
          onChange={(e) => setTermoDigitado(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
        <button type='submit' className='btn' style={{ height: '38px' }}>
          Pesquisar
        </button>

        {temFiltroAtivo && (
          <button
            type='button'
            className='btn'
            onClick={limparBusca}
            style={{ height: '38px' }}
            title='Limpar pesquisa'
          >
            Limpar
          </button>
        )}
      </form>

      <div className='panel'>
        <div className='panel-header'>
          <h2>{meta?.total ?? items.length} registro(s)</h2>
        </div>

        {loading && <div className='empty-state'>Carregando…</div>}
        {!loading && error && <div className='empty-state'>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className='empty-state'>Nenhum registro cadastrado ainda.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <table>
            <thead>
              <tr>
                {config.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {config.columns.map((col) => (
                    <td key={col.key} className={col.mono ? 'mono' : undefined}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  <td>
                    <div className='table-actions'>
                      <button
                        className='btn btn-sm'
                        onClick={() => abrirEdicao(item)}
                      >
                        Editar
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

      {/* Modal de Criação / Edição */}
      {modalItem && (
        <Modal
          title={modalItem.id ? 'Editar registro' : 'Novo registro'}
          onClose={() => setModalItem(null)}
          footer={
            <>
              <button className='btn' onClick={() => setModalItem(null)}>
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
            {config.fields.map((field) => (
              <div className='field' key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    id={field.key}
                    value={modalItem[field.key] ?? ''}
                    required={field.required}
                    onChange={(e) =>
                      setModalItem({
                        ...modalItem,
                        [field.key]: e.target.value,
                      })
                    }
                  >
                    <option value=''>Selecione…</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.key}
                    type={field.type || 'text'}
                    value={modalItem[field.key] ?? ''}
                    required={field.required}
                    onChange={(e) =>
                      setModalItem({
                        ...modalItem,
                        [field.key]: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </form>
        </Modal>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalRemoverAberto && (
        <Modal title='Excluir registro' onClose={fecharModalRemover}>
          <p style={{ marginBottom: 20, color: 'var(--text-main, #333)' }}>
            Tem certeza de que deseja remover o registro{' '}
            <strong>"{getIdentificadorItem(itemAlvo)}"</strong>? Esta ação não
            pode ser desfeita.
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
