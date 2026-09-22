import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import Modal from './Modal';

const LIMIT = 20;

// Busca genérica para qualquer endpoint auxiliar
async function fetchCrudData(endpoint, page) {
  const res = await api.get(`${endpoint}?page=${page}&limit=${LIMIT}`);
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
  const [modalItem, setModalItem] = useState(null); // null = fechado; {} = novo; {...} = editar
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Cache de 10 minutos para qualquer tela de cadastro auxiliar
  const {
    data: respostaCrud,
    isLoading: loading,
    error: erroQuery,
  } = useQuery({
    queryKey: ['crud-page', config.endpoint, page],
    queryFn: () => fetchCrudData(config.endpoint, page),
    staleTime: 1000 * 60 * 10,
  });

  const items = respostaCrud?.items ?? [];
  const meta = respostaCrud?.meta ?? null;
  const error = erroQuery?.message || '';

  function irParaPagina(novaPagina) {
    setPage(novaPagina);
  }

  function abrirNovo() {
    setFormError('');
    setModalItem({ ...config.emptyItem });
  }

  function abrirEdicao(item) {
    setFormError('');
    setModalItem({ ...item });
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

      // Invalida os caches correspondentes
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

  async function excluir(item) {
    if (
      !window.confirm('Remover este registro? Essa ação não pode ser desfeita.')
    )
      return;
    try {
      // Headers com Content-Type undefined para evitar o erro FST_ERR_CTP_EMPTY_JSON_BODY do Fastify
      const res = await api.delete(`${config.endpoint}/${item.id}`, {
        headers: { 'Content-Type': undefined },
      });

      toast.success(res?.message || 'Registro excluído com sucesso!');

      // Invalida os caches correspondentes após remoção
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
        err.response?.data?.message ||
        err.message ||
        'Não foi possível remover o registro.';
      toast.error(mensagem);
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
    </Layout>
  );
}
