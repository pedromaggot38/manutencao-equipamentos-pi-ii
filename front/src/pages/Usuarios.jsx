import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

// Classes CSS para os pontos indicadores de status
const STATUS_DOT_CLASS = {
  active: 'status-dot-active',
  pending: 'status-dot-pending',
  banned: 'status-dot-banned',
  deactivated: 'status-dot-deactivated',
};

const STATUS_LABEL = {
  active: 'Ativo',
  pending: 'Pendente',
  banned: 'Banido',
  deactivated: 'Desativado',
};

const ROLE_BADGE_CLASS = {
  root: 'badge-role-root',
  admin: 'badge-role-admin',
  user: 'badge-role-user',
};

const FORM_NOVO_PADRAO = {
  name: '',
  username: '',
  email: '',
  phone: '',
  role: 'user',
  password: '',
  passwordConfirm: '',
};

const LIMIT = 10;

async function fetchUsuarios(page, search, role, status) {
  const params = new URLSearchParams({ page, limit: LIMIT });
  if (search?.trim()) params.set('search', search.trim());
  if (role) params.set('role', role);
  if (status) params.set('status', status);

  const res = await api.get(`/users?${params.toString()}`);
  return res?.data !== undefined ? res : { data: res, meta: null };
}

export default function Usuarios() {
  const { user: usuarioLogado } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const podeCriarUsuario =
    usuarioLogado?.role === 'admin' || usuarioLogado?.role === 'root';

  const [page, setPage] = useState(1);
  const [termoDigitado, setTermoDigitado] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtroRole, setFiltroRole] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const temFiltroAtivo =
    buscaAplicada !== '' || filtroRole !== '' || filtroStatus !== '';

  const [modalRemoverAberto, setModalRemoverAberto] = useState(false);
  const [usuarioAlvo, setUsuarioAlvo] = useState(null);

  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [formEdicao, setFormEdicao] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
  });

  // Estado do Modal de Criação
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false);
  const [formCriacao, setFormCriacao] = useState(FORM_NOVO_PADRAO);

  const {
    data: respostaUsuarios,
    isLoading: loading,
    error: erroQuery,
  } = useQuery({
    queryKey: ['users', page, buscaAplicada, filtroRole, filtroStatus],
    queryFn: () => fetchUsuarios(page, buscaAplicada, filtroRole, filtroStatus),
    staleTime: 1000 * 30,
  });

  const items = Array.isArray(respostaUsuarios?.data)
    ? respostaUsuarios.data
    : Array.isArray(respostaUsuarios?.data?.items)
      ? respostaUsuarios.data.items
      : [];

  const meta = respostaUsuarios?.meta ?? null;
  const error = erroQuery?.message || '';

  const criarMutation = useMutation({
    mutationFn: async (dados) => {
      return await api.post('/users', dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso.');
      fecharModalCriacao();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível criar o usuário.';
      toast.error(msg);
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({ id, dados }) => {
      return await api.patch(`/users/${id}`, dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso.');
      fecharModalEdicao();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível atualizar o usuário.';
      toast.error(msg);
    },
  });

  const removerMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário removido permanentemente.');
      fecharModalRemover();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível remover o usuário.';
      toast.error(msg);
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
    setFiltroRole('');
    setFiltroStatus('');
    setPage(1);
  }

  function podeGerenciar(alvo) {
    if (!usuarioLogado) return false;
    if (alvo.id === usuarioLogado.id) return false;
    if (usuarioLogado.role === 'root') return true;
    if (usuarioLogado.role === 'admin') return alvo.role === 'user';
    return false;
  }

  function abrirModalCriar() {
    setFormCriacao({
      ...FORM_NOVO_PADRAO,
      role: 'user', // padrão seguro
    });
    setModalCriacaoAberto(true);
  }

  function fecharModalCriacao() {
    setModalCriacaoAberto(false);
    setFormCriacao(FORM_NOVO_PADRAO);
  }

  function handleSubmitCriacao(e) {
    e.preventDefault();
    if (formCriacao.password !== formCriacao.passwordConfirm) {
      toast.error('As senhas não coincidem.');
      return;
    }

    const payload = {
      name: formCriacao.name.trim(),
      username: formCriacao.username.trim(),
      email: formCriacao.email.trim(),
      role: usuarioLogado?.role === 'root' ? formCriacao.role : 'user',
      password: formCriacao.password,
      passwordConfirm: formCriacao.passwordConfirm,
    };

    if (formCriacao.phone?.trim()) {
      payload.phone = formCriacao.phone.trim();
    }

    criarMutation.mutate(payload);
  }

  function abrirModalRemover(item) {
    setUsuarioAlvo(item);
    setModalRemoverAberto(true);
  }

  function abrirModalEditar(item) {
    setUsuarioAlvo(item);
    setFormEdicao({
      name: item.name ?? '',
      username: item.username ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      role: item.role ?? 'user',
      status: item.status ?? 'active',
    });
    setModalEdicaoAberto(true);
  }

  function fecharModalRemover() {
    setModalRemoverAberto(false);
    setUsuarioAlvo(null);
  }

  function fecharModalEdicao() {
    setModalEdicaoAberto(false);
    setUsuarioAlvo(null);
  }

  function confirmarRemocao() {
    if (!usuarioAlvo) return;
    removerMutation.mutate(usuarioAlvo.id);
  }

  function handleSubmitEdicao(e) {
    e.preventDefault();
    if (!usuarioAlvo) return;
    atualizarMutation.mutate({ id: usuarioAlvo.id, dados: formEdicao });
  }

  const valorDinamicoStatus = usuarioAlvo?.isVerified ? 'active' : 'pending';
  const labelDinamicoStatus = usuarioAlvo?.isVerified ? 'Ativo' : 'Pendente';

  return (
    <Layout
      title='Usuários'
      actions={
        podeCriarUsuario && (
          <button className='btn btn-primary' onClick={abrirModalCriar}>
            + Novo usuário
          </button>
        )
      }
    >
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
          placeholder='Buscar por nome ou username…'
          value={termoDigitado}
          onChange={(e) => setTermoDigitado(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />

        <select
          value={filtroRole}
          onChange={(e) => {
            setFiltroRole(e.target.value);
            setPage(1);
          }}
          style={{
            minWidth: 160,
            height: '38px',
            padding: '0 12px',
            borderRadius: 'var(--radius, 4px)',
            border: '1px solid var(--border)',
            background: 'var(--bg-input, #fff)',
            color: 'var(--text-main, #333)',
            fontSize: '13.5px',
          }}
        >
          <option value=''>Todos os cargos</option>
          <option value='user'>User</option>
          <option value='admin'>Admin</option>
          <option value='root'>Root</option>
        </select>

        <select
          value={filtroStatus}
          onChange={(e) => {
            setFiltroStatus(e.target.value);
            setPage(1);
          }}
          style={{
            minWidth: 160,
            height: '38px',
            padding: '0 12px',
            borderRadius: 'var(--radius, 4px)',
            border: '1px solid var(--border)',
            background: 'var(--bg-input, #fff)',
            color: 'var(--text-main, #333)',
            fontSize: '13.5px',
          }}
        >
          <option value=''>Todos os status</option>
          <option value='active'>Ativo</option>
          <option value='pending'>Pendente</option>
          <option value='banned'>Banido</option>
          <option value='deactivated'>Desativado</option>
        </select>

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
          <h2>{meta?.total ?? items.length} usuário(s)</h2>
        </div>

        {loading && <div className='empty-state'>A carregar…</div>}
        {!loading && error && <div className='empty-state'>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className='empty-state'>Nenhum usuário encontrado.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const temPermissao = podeGerenciar(item);

                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className='mono'>{item.username}</td>
                    <td className='mono'>{item.email}</td>
                    <td>
                      <span
                        className={`badge ${ROLE_BADGE_CLASS[item.role] || 'badge-role-user'}`}
                      >
                        {item.role}
                      </span>
                    </td>
                    <td>
                      <div className='status-indicator'>
                        <span
                          className={`status-dot ${
                            STATUS_DOT_CLASS[item.status] ||
                            'status-dot-deactivated'
                          }`}
                        />
                        <span>{STATUS_LABEL[item.status] || item.status}</span>
                      </div>
                    </td>
                    <td>
                      <div className='table-actions'>
                        {temPermissao && (
                          <button
                            type='button'
                            className='btn btn-sm'
                            onClick={() => abrirModalEditar(item)}
                          >
                            Editar
                          </button>
                        )}
                        {usuarioLogado?.role === 'root' &&
                          item.id !== usuarioLogado.id && (
                            <button
                              type='button'
                              className='btn btn-sm btn-danger'
                              onClick={() => abrirModalRemover(item)}
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

        {/* Paginação */}
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

      {/* Modal de Criação de Novo Usuário */}
      {modalCriacaoAberto && (
        <Modal
          isOpen={modalCriacaoAberto}
          onClose={fecharModalCriacao}
          title='Novo usuário'
        >
          <form onSubmit={handleSubmitCriacao}>
            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='create-name'>Nome completo</label>
              <input
                id='create-name'
                type='text'
                value={formCriacao.name}
                onChange={(e) =>
                  setFormCriacao({ ...formCriacao, name: e.target.value })
                }
                required
              />
            </div>

            <div
              className='field-row'
              style={{ display: 'flex', gap: 12, marginBottom: 14 }}
            >
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='create-username'>Nome de usuário</label>
                <input
                  id='create-username'
                  type='text'
                  className='mono'
                  value={formCriacao.username}
                  onChange={(e) =>
                    setFormCriacao({ ...formCriacao, username: e.target.value })
                  }
                  required
                />
              </div>

              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='create-phone'>Telefone (opcional)</label>
                <input
                  id='create-phone'
                  type='text'
                  value={formCriacao.phone}
                  onChange={(e) =>
                    setFormCriacao({ ...formCriacao, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='create-email'>E-mail</label>
              <input
                id='create-email'
                type='email'
                className='mono'
                value={formCriacao.email}
                onChange={(e) =>
                  setFormCriacao({ ...formCriacao, email: e.target.value })
                }
                required
              />
            </div>

            {/* Cargo: se for root, escolhe entre 'user' e 'admin'. Se for admin, bloqueado em 'user' */}
            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='create-role'>Cargo</label>
              {usuarioLogado?.role === 'root' ? (
                <select
                  id='create-role'
                  value={formCriacao.role}
                  onChange={(e) =>
                    setFormCriacao({ ...formCriacao, role: e.target.value })
                  }
                >
                  <option value='user'>User</option>
                  <option value='admin'>Admin</option>
                </select>
              ) : (
                <select id='create-role' value='user' disabled>
                  <option value='user'>User</option>
                </select>
              )}
            </div>

            <div
              className='field-row'
              style={{ display: 'flex', gap: 12, marginBottom: 20 }}
            >
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='create-password'>Senha</label>
                <input
                  id='create-password'
                  type='password'
                  value={formCriacao.password}
                  onChange={(e) =>
                    setFormCriacao({ ...formCriacao, password: e.target.value })
                  }
                  required
                />
              </div>

              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='create-password-confirm'>Confirmar senha</label>
                <input
                  id='create-password-confirm'
                  type='password'
                  value={formCriacao.passwordConfirm}
                  onChange={(e) =>
                    setFormCriacao({
                      ...formCriacao,
                      passwordConfirm: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}
            >
              <button
                type='button'
                className='btn'
                onClick={fecharModalCriacao}
                disabled={criarMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={criarMutation.isPending}
              >
                {criarMutation.isPending ? 'Criando…' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Exclusão */}
      {modalRemoverAberto && (
        <Modal
          isOpen={modalRemoverAberto}
          onClose={fecharModalRemover}
          title='Excluir usuário'
        >
          <p style={{ marginBottom: 20, color: 'var(--text-main, #333)' }}>
            Tem certeza de que deseja remover permanentemente o usuário{' '}
            {usuarioAlvo?.name}? Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type='button' className='btn' onClick={fecharModalRemover}>
              Cancelar
            </button>
            <button
              type='button'
              className='btn btn-danger'
              onClick={confirmarRemocao}
              disabled={removerMutation.isPending}
            >
              {removerMutation.isPending ? 'A remover…' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal de Edição */}
      {modalEdicaoAberto && (
        <Modal
          isOpen={modalEdicaoAberto}
          onClose={fecharModalEdicao}
          title={`Editar usuário: ${usuarioAlvo?.name}`}
        >
          <form onSubmit={handleSubmitEdicao}>
            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='edit-name'>Nome completo</label>
              <input
                id='edit-name'
                type='text'
                value={formEdicao.name}
                onChange={(e) =>
                  setFormEdicao({ ...formEdicao, name: e.target.value })
                }
                required
              />
            </div>

            <div
              className='field-row'
              style={{ display: 'flex', gap: 12, marginBottom: 14 }}
            >
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-username'>Nome de usuário</label>
                <input
                  id='edit-username'
                  type='text'
                  className='mono'
                  value={formEdicao.username}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, username: e.target.value })
                  }
                  required
                />
              </div>

              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-phone'>Telefone</label>
                <input
                  id='edit-phone'
                  type='text'
                  value={formEdicao.phone}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='field' style={{ marginBottom: 14 }}>
              <label htmlFor='edit-email'>E-mail</label>
              <input
                id='edit-email'
                type='email'
                className='mono'
                value={formEdicao.email}
                onChange={(e) =>
                  setFormEdicao({ ...formEdicao, email: e.target.value })
                }
                required
              />
            </div>

            <div
              className='field-row'
              style={{ display: 'flex', gap: 12, marginBottom: 20 }}
            >
              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-role'>Cargo</label>
                <select
                  id='edit-role'
                  value={formEdicao.role}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, role: e.target.value })
                  }
                >
                  <option value='user'>User</option>
                  <option value='admin'>Admin</option>
                </select>
              </div>

              <div className='field' style={{ flex: 1 }}>
                <label htmlFor='edit-status'>Status</label>
                <select
                  id='edit-status'
                  value={formEdicao.status}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, status: e.target.value })
                  }
                >
                  <option value='deactivated'>Desativado</option>
                  <option value='banned'>Banido</option>
                  <option value={valorDinamicoStatus}>
                    {labelDinamicoStatus}
                  </option>
                </select>
              </div>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}
            >
              <button type='button' className='btn' onClick={fecharModalEdicao}>
                Cancelar
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={atualizarMutation.isPending}
              >
                {atualizarMutation.isPending ? 'A guardar…' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
