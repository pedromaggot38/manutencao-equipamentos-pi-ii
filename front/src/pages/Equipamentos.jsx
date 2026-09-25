import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const SITUACAO_BADGE = {
  ativo: 'badge-green',
  'em manutenção': 'badge-amber',
  inativo: 'badge-red',
  baixado: 'badge-red',
};

const CAMPOS_VAZIOS = {
  patrimonio: '',
  capacidade: '',
  unidade_medida: '',
  valor_bem: '',
  situacao: '',
  tipo: '',
  modelo: '',
  categoria_id: '',
  marca_id: '',
  local_id: '',
};

const LIMIT = 10;

// Filtros da listagem (valores vazios = sem filtro)
const FILTROS_VAZIOS = {
  situacao: '',
  categoria_id: '',
  marca_id: '',
  predio_id: '',
  ordenacao: '',
};

// Opções de ordenação: valor = "campo:direção"
const OPCOES_ORDENACAO = [
  { value: '', label: 'Mais recentes' },
  { value: 'patrimonio:asc', label: 'Patrimônio (A–Z)' },
  { value: 'valor_bem:desc', label: 'Maior valor' },
  { value: 'valor_bem:asc', label: 'Menor valor' },
  { value: 'capacidade:desc', label: 'Maior capacidade' },
];

// Funções de busca com desempacotamento seguro
async function fetchEquipamentos(page, search, filtros = {}) {
  const params = new URLSearchParams({ page, limit: LIMIT });
  if (search?.trim()) params.set('search', search.trim());

  // Envia só os filtros preenchidos
  const { ordenacao, ...outrosFiltros } = filtros;
  Object.entries(outrosFiltros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) {
      params.set(chave, valor);
    }
  });

  if (ordenacao) {
    const [sortBy, sortOrder] = ordenacao.split(':');
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
  }

  const res = await api.get(`/equipamentos?${params.toString()}`);
  return res?.data !== undefined ? res : { data: res, meta: null };
}

async function fetchAuxiliar(endpoint, limit = 100) {
  const res = await api.get(`${endpoint}?limit=${limit}`);
  const payload = res?.data !== undefined ? res.data : res;
  return payload?.items ?? (Array.isArray(payload) ? payload : []);
}

export default function Equipamentos() {
  const { user } = useAuth();
  const podeExcluir = user?.role === 'admin' || user?.role === 'root';
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [termoDigitado, setTermoDigitado] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);

  const temFiltroAtivo =
    buscaAplicada !== '' || Object.values(filtros).some((v) => v !== '');

  const [modalItem, setModalItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Estados para o Modal de Exclusão
  const [modalRemoverAberto, setModalRemoverAberto] = useState(false);
  const [equipamentoAlvo, setEquipamentoAlvo] = useState(null);

  // 1. Query da listagem de equipamentos (Cache de 30s)
  const {
    data: respostaEquipamentos,
    isLoading: loading,
    error: erroQuery,
  } = useQuery({
    queryKey: ['equipamentos', page, buscaAplicada, filtros],
    queryFn: () => fetchEquipamentos(page, buscaAplicada, filtros),
    staleTime: 1000 * 30,
  });

  const items = Array.isArray(respostaEquipamentos?.data)
    ? respostaEquipamentos.data
    : Array.isArray(respostaEquipamentos?.data?.items)
      ? respostaEquipamentos.data.items
      : [];

  const meta = respostaEquipamentos?.meta ?? null;
  const error = erroQuery?.message || '';

  // 2. Auxiliares em cache de 15 minutos (sem paginação infinita)
  const { data: categorias = [] } = useQuery({
    queryKey: ['auxiliares-categorias'],
    queryFn: () => fetchAuxiliar('/auxiliares/categorias', 100),
    staleTime: 1000 * 60 * 15,
  });

  const { data: marcas = [] } = useQuery({
    queryKey: ['auxiliares-marcas'],
    queryFn: () => fetchAuxiliar('/auxiliares/marcas', 100),
    staleTime: 1000 * 60 * 15,
  });

  const { data: locais = [] } = useQuery({
    queryKey: ['auxiliares-locais'],
    queryFn: () => fetchAuxiliar('/auxiliares/locais', 500),
    staleTime: 1000 * 60 * 15,
  });

  const { data: predios = [] } = useQuery({
    queryKey: ['auxiliares-predios'],
    queryFn: () => fetchAuxiliar('/auxiliares/predios', 100),
    staleTime: 1000 * 60 * 15,
  });

  const { data: resumo } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res?.data !== undefined ? res.data : res;
    },
    staleTime: 1000 * 60 * 5,
  });
  const situacoes = (resumo?.equipamentosPorSituacao ?? [])
    .map((s) => s.nome)
    .filter(Boolean);

  // Mutation de Exclusão
  const excluirMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/equipamentos/${id}`, {
        headers: { 'Content-Type': undefined },
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Equipamento excluído com sucesso!');
      fecharModalRemover();
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      queryClient.invalidateQueries({
        queryKey: ['auxiliares-equipamentos-select'],
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-rapidos'] });
    },
    onError: (err) => {
      const mensagem =
        err.response?.data?.message ||
        err.message ||
        'Não foi possível remover o equipamento.';
      toast.error(mensagem);
      fecharModalRemover();
    },
  });

  function alterarFiltro(chave, valor) {
    setPage(1);
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
  }

  function limparFiltros() {
    setPage(1);
    setTermoDigitado('');
    setBuscaAplicada('');
    setFiltros(FILTROS_VAZIOS);
  }

  function irParaPagina(novaPagina) {
    setPage(novaPagina);
  }

  function buscar(e) {
    e.preventDefault();
    setPage(1);
    setBuscaAplicada(termoDigitado);
  }

  function abrirNovo() {
    setFormError('');
    setModalItem({ ...CAMPOS_VAZIOS });
  }

  function abrirEdicao(item) {
    setFormError('');
    setModalItem({ ...item });
  }

  function abrirModalRemover(item) {
    setEquipamentoAlvo(item);
    setModalRemoverAberto(true);
  }

  function fecharModalRemover() {
    setModalRemoverAberto(false);
    setEquipamentoAlvo(null);
  }

  function confirmarRemocao() {
    if (!equipamentoAlvo) return;
    excluirMutation.mutate(equipamentoAlvo.id);
  }

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const isEdicao = Boolean(modalItem.id);
      const payload = {
        ...modalItem,
        capacidade: Number(modalItem.capacidade),
        valor_bem: Number(modalItem.valor_bem),
        categoria_id: Number(modalItem.categoria_id),
        marca_id: Number(modalItem.marca_id),
        local_id: Number(modalItem.local_id),
      };
      delete payload.id;
      delete payload.categoria;
      delete payload.marca;
      delete payload.local;

      let res;
      if (isEdicao) {
        res = await api.patch(`/equipamentos/${modalItem.id}`, payload);
      } else {
        res = await api.post('/equipamentos', payload);
      }

      setModalItem(null);
      toast.success(res?.message || 'Equipamento salvo com sucesso!');

      // Invalida as queries necessárias
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      queryClient.invalidateQueries({
        queryKey: ['auxiliares-equipamentos-select'],
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores-rapidos'] });
    } catch (err) {
      const mensagem =
        err.payload?.errors?.[0]?.mensagem ||
        err.response?.data?.message ||
        err.message ||
        'Erro ao salvar equipamento.';
      setFormError(mensagem);
      toast.error(mensagem);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout
      title='Equipamentos'
      actions={
        <button className='btn btn-primary' onClick={abrirNovo}>
          + Novo equipamento
        </button>
      }
    >
      <form className='toolbar' onSubmit={buscar}>
        <input
          type='search'
          placeholder='Buscar por patrimônio, tipo ou modelo…'
          value={termoDigitado}
          onChange={(e) => setTermoDigitado(e.target.value)}
        />
        <select
          value={filtros.situacao}
          onChange={(e) => alterarFiltro('situacao', e.target.value)}
        >
          <option value=''>Todas as situações</option>
          {situacoes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filtros.categoria_id}
          onChange={(e) => alterarFiltro('categoria_id', e.target.value)}
        >
          <option value=''>Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome_categoria}
            </option>
          ))}
        </select>

        <select
          value={filtros.predio_id}
          onChange={(e) => alterarFiltro('predio_id', e.target.value)}
        >
          <option value=''>Todos os prédios</option>
          {predios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome_predio}
            </option>
          ))}
        </select>

        <select
          value={filtros.marca_id}
          onChange={(e) => alterarFiltro('marca_id', e.target.value)}
        >
          <option value=''>Todas as marcas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.marca}
            </option>
          ))}
        </select>

        <select
          value={filtros.ordenacao}
          onChange={(e) => alterarFiltro('ordenacao', e.target.value)}
        >
          {OPCOES_ORDENACAO.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button type='submit' className='btn'>
          Buscar
        </button>

        {temFiltroAtivo && (
          <button type='button' className='btn' onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </form>

      <div className='panel'>
        <div className='panel-header'>
          <h2>{meta?.total ?? items.length} equipamento(s)</h2>
        </div>

        {loading && <div className='empty-state'>Carregando…</div>}
        {!loading && error && <div className='empty-state'>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className='empty-state'>Nenhum equipamento encontrado.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Patrimônio</th>
                <th>Tipo / Modelo</th>
                <th>Capacidade</th>
                <th>Valor</th>
                <th>Situação</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className='mono'>{item.patrimonio}</td>
                  <td>
                    {item.tipo || '—'}
                    {item.modelo ? ` · ${item.modelo}` : ''}
                  </td>
                  <td className='mono'>
                    {item.capacidade} {item.unidade_medida}
                  </td>
                  <td className='mono'>
                    {Number(item.valor_bem).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        SITUACAO_BADGE[item.situacao?.toLowerCase()] ||
                        'badge-neutral'
                      }`}
                    >
                      {item.situacao}
                    </span>
                  </td>
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
          title={modalItem.id ? 'Editar equipamento' : 'Novo equipamento'}
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

            <div className='field'>
              <label htmlFor='patrimonio'>Número de patrimônio</label>
              <input
                id='patrimonio'
                required
                value={modalItem.patrimonio}
                onChange={(e) =>
                  setModalItem({ ...modalItem, patrimonio: e.target.value })
                }
              />
            </div>

            <div className='field-row'>
              <div className='field'>
                <label htmlFor='tipo'>Tipo</label>
                <input
                  id='tipo'
                  value={modalItem.tipo ?? ''}
                  onChange={(e) =>
                    setModalItem({ ...modalItem, tipo: e.target.value })
                  }
                />
              </div>
              <div className='field'>
                <label htmlFor='modelo'>Modelo</label>
                <input
                  id='modelo'
                  value={modalItem.modelo ?? ''}
                  onChange={(e) =>
                    setModalItem({ ...modalItem, modelo: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='field-row'>
              <div className='field'>
                <label htmlFor='capacidade'>Capacidade</label>
                <input
                  id='capacidade'
                  type='number'
                  step='0.01'
                  required
                  value={modalItem.capacidade}
                  onChange={(e) =>
                    setModalItem({ ...modalItem, capacidade: e.target.value })
                  }
                />
              </div>
              <div className='field'>
                <label htmlFor='unidade_medida'>Unidade de medida</label>
                <input
                  id='unidade_medida'
                  required
                  placeholder='kg, BTU, un…'
                  value={modalItem.unidade_medida}
                  onChange={(e) =>
                    setModalItem({
                      ...modalItem,
                      unidade_medida: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className='field-row'>
              <div className='field'>
                <label htmlFor='valor_bem'>Valor do bem (R$)</label>
                <input
                  id='valor_bem'
                  type='number'
                  step='0.01'
                  required
                  value={modalItem.valor_bem}
                  onChange={(e) =>
                    setModalItem({ ...modalItem, valor_bem: e.target.value })
                  }
                />
              </div>
              <div className='field'>
                <label htmlFor='situacao'>Situação</label>
                <input
                  id='situacao'
                  required
                  placeholder='ativo, em manutenção…'
                  value={modalItem.situacao}
                  onChange={(e) =>
                    setModalItem({ ...modalItem, situacao: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='field'>
              <label htmlFor='categoria_id'>Categoria</label>
              <select
                id='categoria_id'
                required
                value={modalItem.categoria_id}
                onChange={(e) =>
                  setModalItem({ ...modalItem, categoria_id: e.target.value })
                }
              >
                <option value=''>Selecione…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_categoria}
                  </option>
                ))}
              </select>
            </div>

            <div className='field'>
              <label htmlFor='marca_id'>Marca</label>
              <select
                id='marca_id'
                required
                value={modalItem.marca_id}
                onChange={(e) =>
                  setModalItem({ ...modalItem, marca_id: e.target.value })
                }
              >
                <option value=''>Selecione…</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.marca}
                  </option>
                ))}
              </select>
            </div>

            <div className='field'>
              <label htmlFor='local_id'>Local</label>
              <select
                id='local_id'
                required
                value={modalItem.local_id}
                onChange={(e) =>
                  setModalItem({ ...modalItem, local_id: e.target.value })
                }
              >
                <option value=''>Selecione…</option>
                {locais.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome_local}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalRemoverAberto && (
        <Modal title='Excluir equipamento' onClose={fecharModalRemover}>
          <p style={{ marginBottom: 20, color: 'var(--text-main, #333)' }}>
            Tem certeza de que deseja remover permanentemente o equipamento{' '}
            <strong>{equipamentoAlvo?.patrimonio}</strong>
            {equipamentoAlvo?.modelo ? ` (${equipamentoAlvo.modelo})` : ''}?
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
