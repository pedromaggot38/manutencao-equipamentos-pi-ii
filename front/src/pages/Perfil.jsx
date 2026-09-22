import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

export default function Perfil() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [abaAtiva, setAbaAtiva] = useState('dados');

  // Aba 1: Dados Pessoais
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [salvandoDados, setSalvandoDados] = useState(false);

  // Aba 2: Segurança
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Aba 3: Verificação & E-mail
  const [modoTrocaEmail, setModoTrocaEmail] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [validandoCodigo, setValidandoCodigo] = useState(false);

  // Aba 4: Desativar Conta Própria
  const [senhaDesativacao, setSenhaDesativacao] = useState('');
  const [modalDesativarAberto, setModalDesativarAberto] = useState(false);
  const [desativandoConta, setDesativandoConta] = useState(false);

  // Sincroniza os estados locais sempre que o user do AuthContext carregar ou mudar
  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  // Atualizar Perfil (apenas dados textuais)
  async function handleSalvarPerfil(e) {
    e.preventDefault();

    const nomeAlterado = name.trim() !== (user?.name ?? '');
    const telefoneAlterado = phone.trim() !== (user?.phone ?? '');

    if (!nomeAlterado && !telefoneAlterado) {
      toast.info('Nenhuma alteração foi realizada.');
      return;
    }

    setSalvandoDados(true);

    try {
      const payload = {};
      if (nomeAlterado) payload.name = name.trim();
      if (telefoneAlterado) payload.phone = phone.trim();

      const res = await api.patch('/me', payload);

      const usuarioAtualizado = res?.data?.user ?? res?.data ?? res;
      setUser(usuarioAtualizado);
      localStorage.setItem('@App:user', JSON.stringify(usuarioAtualizado));

      toast.success(res?.message || 'Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error(
        err.payload?.errors?.[0]?.mensagem ||
          err.response?.data?.message ||
          err.message ||
          'Erro ao atualizar dados cadastrais.',
      );
    } finally {
      setSalvandoDados(false);
    }
  }

  // Alterar Senha
  async function handleAlterarSenha(e) {
    e.preventDefault();
    if (newPassword !== passwordConfirm) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    setSalvandoSenha(true);
    try {
      const res = await api.patch('/me/password', {
        currentPassword,
        newPassword,
        passwordConfirm,
      });

      toast.success(res?.message || 'Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirm('');
    } catch (err) {
      toast.error(
        err.payload?.errors?.[0]?.mensagem ||
          err.response?.data?.message ||
          err.message ||
          'Não foi possível alterar a senha.',
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  // Solicitar Código de Verificação / E-mail
  async function handleSolicitarCodigo() {
    setEnviandoCodigo(true);
    try {
      if (modoTrocaEmail) {
        if (!novoEmail.trim()) {
          toast.error('Digite o novo endereço de e-mail.');
          setEnviandoCodigo(false);
          return;
        }
        const res = await api.post('/me/email', { newEmail: novoEmail.trim() });
        toast.success(res?.message || 'Código enviado para o novo e-mail!');
        setCodigoEnviado(true);
      } else {
        const res = await api.post('/me/activation', {});
        toast.success(res?.message || 'Código enviado para seu e-mail!');
        setCodigoEnviado(true);
      }
    } catch (err) {
      toast.error(
        err.payload?.errors?.[0]?.mensagem ||
          err.response?.data?.message ||
          err.message ||
          'Erro ao solicitar código de verificação.',
      );
    } finally {
      setEnviandoCodigo(false);
    }
  }

  // Confirmar Código de Verificação / E-mail
  async function handleConfirmarCodigo(e) {
    e.preventDefault();
    if (!codigoOtp.trim()) {
      toast.error('Digite o código de verificação recebido.');
      return;
    }

    setValidandoCodigo(true);
    try {
      if (modoTrocaEmail) {
        const res = await api.patch('/me/email', { token: codigoOtp.trim() });
        const usuarioAtualizado = res?.data?.user ?? res?.data ?? res;
        setUser(usuarioAtualizado);
        localStorage.setItem('@App:user', JSON.stringify(usuarioAtualizado));
        toast.success(res?.message || 'E-mail alterado com sucesso!');
        setModoTrocaEmail(false);
        setNovoEmail('');
      } else {
        const res = await api.patch('/me/activation', {
          token: codigoOtp.trim(),
        });
        const usuarioAtualizado = {
          ...user,
          isVerified: true,
          status: 'active',
        };
        setUser(usuarioAtualizado);
        localStorage.setItem('@App:user', JSON.stringify(usuarioAtualizado));
        toast.success(res?.message || 'Conta verificada com sucesso!');
      }

      setCodigoOtp('');
      setCodigoEnviado(false);
    } catch (err) {
      toast.error(
        err.payload?.errors?.[0]?.mensagem ||
          err.response?.data?.message ||
          err.message ||
          'Código inválido ou expirado.',
      );
    } finally {
      setValidandoCodigo(false);
    }
  }

  // Desativar Própria Conta
  async function handleDesativarConta(e) {
    e.preventDefault();
    if (!senhaDesativacao.trim()) {
      toast.error('Digite sua senha para confirmar a desativação.');
      return;
    }

    setDesativandoConta(true);
    try {
      const res = await api.patch('/me/deactivate', {
        password: senhaDesativacao.trim(),
      });

      toast.success(res?.message || 'Conta desativada com sucesso.');
      setModalDesativarAberto(false);
      setSenhaDesativacao('');

      logout();
      navigate('/login');
    } catch (err) {
      toast.error(
        err.payload?.errors?.[0]?.mensagem ||
          err.response?.data?.message ||
          err.message ||
          'Não foi possível desativar a conta.',
      );
    } finally {
      setDesativandoConta(false);
    }
  }

  return (
    <Layout
      title='Meu Perfil'
      description='Gerencie suas informações de conta e segurança.'
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Banner de atenção compacto */}
        {user?.isVerified === false && (
          <div
            className='panel'
            style={{
              borderLeft: '4px solid var(--accent-red, #af3a28)',
              background: 'var(--accent-red-soft, rgba(175, 58, 40, 0.08))',
              padding: '12px 18px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: '13.5px',
            }}
          >
            <span>
              <strong>Ação necessária:</strong> Sua conta ainda não foi
              verificada.
            </span>
            <button
              type='button'
              className='btn btn-sm btn-danger'
              onClick={() => {
                setAbaAtiva('verificacao');
                setModoTrocaEmail(false);
              }}
            >
              Verificar agora
            </button>
          </div>
        )}

        <div className='panel'>
          {/* Cabeçalho de Navegação por Abas (Sem scroll vertical indesejado) */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              padding: '0 24px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <button
              type='button'
              onClick={() => setAbaAtiva('dados')}
              style={{
                padding: '14px 0',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color:
                  abaAtiva === 'dados' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom:
                  abaAtiva === 'dados'
                    ? '2px solid var(--primary)'
                    : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Dados Pessoais
            </button>

            <button
              type='button'
              onClick={() => setAbaAtiva('seguranca')}
              style={{
                padding: '14px 0',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color:
                  abaAtiva === 'seguranca'
                    ? 'var(--primary)'
                    : 'var(--text-muted)',
                borderBottom:
                  abaAtiva === 'seguranca'
                    ? '2px solid var(--primary)'
                    : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Segurança
            </button>

            <button
              type='button'
              onClick={() => setAbaAtiva('verificacao')}
              style={{
                padding: '14px 0',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color:
                  abaAtiva === 'verificacao'
                    ? 'var(--primary)'
                    : 'var(--text-muted)',
                borderBottom:
                  abaAtiva === 'verificacao'
                    ? '2px solid var(--primary)'
                    : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Verificação & E-mail
            </button>

            <button
              type='button'
              onClick={() => setAbaAtiva('desativacao')}
              style={{
                padding: '14px 0',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color:
                  abaAtiva === 'desativacao'
                    ? 'var(--accent-red, #af3a28)'
                    : 'var(--text-muted)',
                borderBottom:
                  abaAtiva === 'desativacao'
                    ? '2px solid var(--accent-red, #af3a28)'
                    : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Desativar Conta
            </button>
          </div>

          <div className='panel-body' style={{ padding: '24px' }}>
            {/* ABA 1: DADOS PESSOAIS */}
            {abaAtiva === 'dados' && (
              <form onSubmit={handleSalvarPerfil}>
                <div className='field-row'>
                  <div className='field'>
                    <label htmlFor='perfil-nome'>Nome completo</label>
                    <input
                      id='perfil-nome'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className='field'>
                    <label htmlFor='perfil-phone'>Telefone</label>
                    <input
                      id='perfil-phone'
                      placeholder='Ex: 11987654321'
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className='field-row'>
                  <div className='field'>
                    <label htmlFor='perfil-user'>Nome de usuário</label>
                    <input
                      id='perfil-user'
                      className='mono'
                      value={user?.username ?? ''}
                      disabled
                    />
                  </div>

                  <div className='field'>
                    <label htmlFor='perfil-email-leitura'>
                      E-mail cadastrado
                    </label>
                    <input
                      id='perfil-email-leitura'
                      value={user?.email ?? ''}
                      disabled
                      title='Para alterar seu e-mail, utilize a aba de Verificação'
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    type='submit'
                    className='btn btn-primary'
                    disabled={salvandoDados}
                  >
                    {salvandoDados ? 'Salvando…' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            )}

            {/* ABA 2: SEGURANÇA */}
            {abaAtiva === 'seguranca' && (
              <form onSubmit={handleAlterarSenha} style={{ maxWidth: 440 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    marginBottom: 16,
                  }}
                >
                  A nova senha deve ter no mínimo 4 caracteres.
                </div>

                <div className='field'>
                  <label htmlFor='senha-atual'>Senha atual</label>
                  <input
                    id='senha-atual'
                    type='password'
                    placeholder='Confirme sua senha atual'
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className='field'>
                  <label htmlFor='senha-nova'>Nova senha</label>
                  <input
                    id='senha-nova'
                    type='password'
                    placeholder='Digite a nova senha'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className='field'>
                  <label htmlFor='senha-confirm'>Confirmar nova senha</label>
                  <input
                    id='senha-confirm'
                    type='password'
                    placeholder='Repita a nova senha'
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    type='submit'
                    className='btn btn-primary'
                    disabled={salvandoSenha}
                  >
                    {salvandoSenha ? 'Alterando…' : 'Alterar senha'}
                  </button>
                </div>
              </form>
            )}

            {/* ABA 3: VERIFICAÇÃO & E-MAIL */}
            {abaAtiva === 'verificacao' && (
              <form onSubmit={handleConfirmarCodigo} style={{ maxWidth: 500 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: user?.isVerified
                      ? 'var(--accent-green)'
                      : 'var(--accent-amber)',
                    marginBottom: 20,
                  }}
                >
                  {user?.isVerified
                    ? '✓ Sua conta está verificada e com acesso ativo.'
                    : '⚠ Sua conta ainda não foi verificada. Solicite o código abaixo para confirmá-la.'}
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius, 4px)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 18,
                    background: 'var(--bg-panel-subtle, transparent)',
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        marginBottom: 2,
                      }}
                    >
                      E-mail atual
                    </span>
                    <strong style={{ fontSize: 14 }}>{user?.email}</strong>
                  </div>

                  <button
                    type='button'
                    className='btn btn-sm'
                    onClick={() => {
                      setModoTrocaEmail(!modoTrocaEmail);
                      setCodigoEnviado(false);
                      setCodigoOtp('');
                    }}
                  >
                    {modoTrocaEmail ? 'Cancelar' : 'Alterar e-mail'}
                  </button>
                </div>

                {modoTrocaEmail && (
                  <div className='field' style={{ marginBottom: 18 }}>
                    <label htmlFor='novo-email'>Novo e-mail</label>
                    <input
                      id='novo-email'
                      type='email'
                      placeholder='exemplo@email.com'
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      required
                    />
                    <small
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        marginTop: 4,
                        display: 'block',
                      }}
                    >
                      O código será enviado para este novo endereço para
                      confirmação.
                    </small>
                  </div>
                )}

                {codigoEnviado && (
                  <div
                    className='field'
                    style={{ maxWidth: 220, marginBottom: 20 }}
                  >
                    <label htmlFor='codigo-otp'>Código de verificação</label>
                    <input
                      id='codigo-otp'
                      type='text'
                      maxLength={6}
                      placeholder='000000'
                      value={codigoOtp}
                      onChange={(e) => setCodigoOtp(e.target.value)}
                      className='mono'
                      style={{
                        textAlign: 'center',
                        fontSize: 18,
                        letterSpacing: 4,
                      }}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type='button'
                    className='btn'
                    onClick={handleSolicitarCodigo}
                    disabled={enviandoCodigo}
                  >
                    {enviandoCodigo
                      ? 'Enviando…'
                      : codigoEnviado
                        ? 'Reenviar código'
                        : modoTrocaEmail
                          ? 'Enviar código para novo e-mail'
                          : 'Enviar código de ativação'}
                  </button>

                  {codigoEnviado && (
                    <button
                      type='submit'
                      className='btn btn-primary'
                      disabled={validandoCodigo}
                    >
                      {validandoCodigo ? 'Confirmando…' : 'Confirmar código'}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ABA 4: DESATIVAR CONTA PRÓPRIA */}
            {abaAtiva === 'desativacao' && (
              <div style={{ maxWidth: 480 }}>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius, 4px)',
                    border: '1px solid var(--accent-red, #af3a28)',
                    background:
                      'var(--accent-red-soft, rgba(175, 58, 40, 0.05))',
                    marginBottom: 20,
                  }}
                >
                  <h4
                    style={{
                      color: 'var(--accent-red, #af3a28)',
                      marginBottom: 8,
                      fontSize: 15,
                    }}
                  >
                    Zona de Perigo
                  </h4>
                  <p
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    Ao desativar sua conta, você perderá o acesso imediato ao
                    sistema até que um administrador reative seu perfil. Esta
                    ação exige a confirmação da sua senha atual.
                  </p>
                </div>

                <button
                  type='button'
                  className='btn btn-danger'
                  onClick={() => setModalDesativarAberto(true)}
                >
                  Desativar minha conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Desativar a Própria Conta */}
      {modalDesativarAberto && (
        <Modal
          isOpen={modalDesativarAberto}
          onClose={() => {
            setModalDesativarAberto(false);
            setSenhaDesativacao('');
          }}
          title='Confirmar desativação da conta'
        >
          <form onSubmit={handleDesativarConta}>
            <p
              style={{
                marginBottom: 16,
                fontSize: '13.5px',
                color: 'var(--text-main)',
              }}
            >
              Tem certeza absoluta de que deseja desativar sua conta? Por favor,
              digite sua senha atual para continuar:
            </p>

            <div className='field' style={{ marginBottom: 20 }}>
              <label htmlFor='senha-desativacao'>Sua senha atual</label>
              <input
                id='senha-desativacao'
                type='password'
                placeholder='Digite sua senha'
                value={senhaDesativacao}
                onChange={(e) => setSenhaDesativacao(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}
            >
              <button
                type='button'
                className='btn'
                onClick={() => {
                  setModalDesativarAberto(false);
                  setSenhaDesativacao('');
                }}
              >
                Cancelar
              </button>
              <button
                type='submit'
                className='btn btn-danger'
                disabled={desativandoConta}
              >
                {desativandoConta
                  ? 'Desativando…'
                  : 'Sim, desativar minha conta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
