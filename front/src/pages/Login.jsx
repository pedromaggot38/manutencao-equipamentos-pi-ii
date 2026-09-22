import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function Login() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulário Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Formulário Setup Root
  const [rootForm, setRootForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const destino = location.state?.from?.pathname || '/';

  useEffect(() => {
    let isMounted = true;

    async function checkSetup() {
      try {
        const res = await api.get('/auth/setup');

        // Trata respostas quer venham desempacotadas pelo interceptor ou pelo axios bruto
        const dataObj = res?.data !== undefined ? res.data : res;
        const initialized = dataObj?.data?.initialized ?? dataObj?.initialized;

        if (isMounted && initialized === false) {
          setNeedsSetup(true);
        }
      } catch (err) {
        console.error('Erro ao verificar setup inicial:', err);
      } finally {
        if (isMounted) {
          setCheckingSetup(false);
        }
      }
    }

    if (!user && !authLoading) {
      checkSetup();
    } else {
      setCheckingSetup(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // Se já estiver com sessão iniciada, redireciona
  if (user) {
    return <Navigate to={destino} replace />;
  }

  // Enquanto valida autenticação ou o status do setup
  if (authLoading || checkingSetup) {
    return (
      <div className='login-screen'>
        <div
          className='login-card'
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <p>A carregar...</p>
        </div>
      </div>
    );
  }

  async function handleSubmitLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ username, password });
      toast.success('Sessão iniciada com sucesso!');
      navigate(destino, { replace: true });
    } catch (err) {
      const mensagem =
        err.payload?.errors?.[0]?.mensagem ||
        err.message ||
        'Não foi possível iniciar sessão.';
      toast.error(mensagem);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitSetup(e) {
    e.preventDefault();

    if (rootForm.password !== rootForm.passwordConfirm) {
      const msg = 'As palavras-passe não coincidem.';
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/setup', rootForm);
      await login({
        username: rootForm.username,
        password: rootForm.password,
      });

      toast.success(res?.message || 'Administrador configurado com sucesso!');
      navigate(destino, { replace: true });
    } catch (err) {
      const mensagem =
        err.response?.data?.message ||
        err.payload?.errors?.[0]?.mensagem ||
        err.message ||
        'Erro ao criar o usuário root.';
      toast.error(mensagem);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='login-screen'>
      <div className='login-card'>
        <div className='login-eyebrow'>PI II · UNIVESP</div>
        <h1 className='login-title'>
          {needsSetup
            ? 'Configuração Inicial do Sistema'
            : 'Gestão de Equipamentos e Manutenções'}
        </h1>

        {needsSetup ? (
          <form onSubmit={handleSubmitSetup}>
            <div className='field'>
              <label htmlFor='setup-name'>Nome Completo</label>
              <input
                id='setup-name'
                type='text'
                autoFocus
                value={rootForm.name}
                onChange={(e) =>
                  setRootForm({ ...rootForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='setup-username'>Nome de Usuário</label>
              <input
                id='setup-username'
                type='text'
                value={rootForm.username}
                onChange={(e) =>
                  setRootForm({ ...rootForm, username: e.target.value })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='setup-email'>E-mail</label>
              <input
                id='setup-email'
                type='email'
                value={rootForm.email}
                onChange={(e) =>
                  setRootForm({ ...rootForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='setup-password'>Palavra-passe</label>
              <input
                id='setup-password'
                type='password'
                value={rootForm.password}
                onChange={(e) =>
                  setRootForm({ ...rootForm, password: e.target.value })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='setup-confirm'>Confirmar Palavra-passe</label>
              <input
                id='setup-confirm'
                type='password'
                value={rootForm.passwordConfirm}
                onChange={(e) =>
                  setRootForm({
                    ...rootForm,
                    passwordConfirm: e.target.value,
                  })
                }
                required
              />
            </div>

            <button
              type='submit'
              className='btn btn-primary'
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              {submitting
                ? 'A criar administrador…'
                : 'Criar Conta Administrador'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitLogin}>
            <div className='field'>
              <label htmlFor='username'>Nome de usuário</label>
              <input
                id='username'
                type='text'
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='password'>Palavra-passe</label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type='submit'
              className='btn btn-primary'
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'A entrar…' : 'Entrar'}
            </button>
          </form>
        )}

        <div className='login-footer-note'>
          {needsSetup
            ? 'Crie o usuário root para inicializar o sistema.'
            : 'Acesso restrito a usuários registados no sistema.'}
        </div>
      </div>
    </div>
  );
}
