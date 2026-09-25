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
  const [isRegistering, setIsRegistering] = useState(false);
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

  // Formulário Registo Comum (/auth/signup)
  const [registerForm, setRegisterForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const destino = location.state?.from?.pathname || '/';
  const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

  useEffect(() => {
    let isMounted = true;

    async function checkSetup() {
      try {
        const res = await api.get('/auth/setup');
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

  if (user) {
    return <Navigate to={destino} replace />;
  }

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
        err.response?.data?.message ||
        err.message ||
        'Não foi possível iniciar sessão.';
      toast.error(mensagem);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitSetup(e) {
    e.preventDefault();

    if (!USERNAME_REGEX.test(rootForm.username)) {
      toast.error(
        'O nome de usuário não pode conter espaços ou caracteres especiais.',
      );
      return;
    }

    if (rootForm.password !== rootForm.passwordConfirm) {
      toast.error('As palavras-passe não coincidem.');
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

  async function handleSubmitRegister(e) {
    e.preventDefault();

    if (!USERNAME_REGEX.test(registerForm.username)) {
      toast.error(
        'O nome de usuário não pode conter espaços ou caracteres especiais.',
      );
      return;
    }

    if (registerForm.password !== registerForm.passwordConfirm) {
      toast.error('As palavras-passe não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/signup', registerForm);
      await login({
        username: registerForm.username,
        password: registerForm.password,
      });

      toast.success(res?.message || 'Conta criada com sucesso!');
      navigate(destino, { replace: true });
    } catch (err) {
      const mensagem =
        err.response?.data?.message ||
        err.payload?.errors?.[0]?.mensagem ||
        err.message ||
        'Erro ao realizar o registo.';
      toast.error(mensagem);
    } finally {
      setSubmitting(false);
    }
  }

  function getTitulo() {
    if (needsSetup) return 'Configuração Inicial do Sistema';
    if (isRegistering) return 'Criar Nova Conta';
    return 'Gestão de Equipamentos e Manutenções';
  }

  function getNotaRodape() {
    if (needsSetup) return 'Crie o usuário root para inicializar o sistema.';
    if (isRegistering)
      return 'Registo de novos membros com perfil comum de usuário.';
    return 'Acesso restrito a usuários registados no sistema.';
  }

  return (
    <div className='login-screen'>
      <div className='login-card'>
        <div className='login-eyebrow'>PI II · UNIVESP</div>
        <h1 className='login-title'>{getTitulo()}</h1>

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
                pattern='^[a-zA-Z0-9_]+$'
                title='Utilize apenas letras, números e sublinhado (_), sem espaços ou caracteres especiais.'
                value={rootForm.username}
                onChange={(e) =>
                  setRootForm({
                    ...rootForm,
                    username: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                  })
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
                  setRootForm({ ...rootForm, passwordConfirm: e.target.value })
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
        ) : isRegistering ? (
          <form onSubmit={handleSubmitRegister}>
            <div className='field'>
              <label htmlFor='reg-name'>Nome Completo</label>
              <input
                id='reg-name'
                type='text'
                autoFocus
                placeholder='Ex: User User'
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='reg-username'>Nome de Usuário</label>
              <input
                id='reg-username'
                type='text'
                placeholder='Ex: user_123'
                pattern='^[a-zA-Z0-9_]+$'
                title='Utilize apenas letras, números e sublinhado (_), sem espaços ou caracteres especiais.'
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    username: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                  })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='reg-email'>E-mail</label>
              <input
                id='reg-email'
                type='email'
                placeholder='Ex: user@gmail.com'
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='reg-password'>Palavra-passe</label>
              <input
                id='reg-password'
                type='password'
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='reg-confirm'>Confirmar Palavra-passe</label>
              <input
                id='reg-confirm'
                type='password'
                value={registerForm.passwordConfirm}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
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
              {submitting ? 'A registar…' : 'Registar Conta'}
            </button>

            <button
              type='button'
              className='btn'
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => setIsRegistering(false)}
            >
              Já tenho conta (Entrar)
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitLogin}>
            <div className='field'>
              <label htmlFor='username'>Nome de Usuário</label>
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

            <button
              type='button'
              className='btn'
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => setIsRegistering(true)}
            >
              Criar nova conta
            </button>
          </form>
        )}

        <div className='login-footer-note'>{getNotaRodape()}</div>
      </div>
    </div>
  );
}
