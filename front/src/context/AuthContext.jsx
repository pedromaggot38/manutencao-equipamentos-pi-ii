import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  signin as apiSignin,
  signout as apiSignout,
  fetchMe,
} from '../api/auth';
import { apiFetch, setAccessToken } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('@App:user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  // Escuta expiração da sessão disparada pelas chamadas de API
  useEffect(() => {
    const handleExpired = (e) => {
      setUser(null);
      localStorage.removeItem('@App:user');
      localStorage.removeItem('@App:token');
      setAccessToken(null);

      toast.error(e.detail || 'Sua sessão expirou. Entre novamente.');
    };

    window.addEventListener('session-expired', handleExpired);
    return () => {
      window.removeEventListener('session-expired', handleExpired);
    };
  }, [toast]);

  // Checagem e validação inicial de credenciais
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // 1. Tenta validar a sessão atual diretamente chamando o /me
        try {
          const me = await fetchMe();
          if (isMounted && me) {
            setUser(me);
            localStorage.setItem('@App:user', JSON.stringify(me));
            return;
          }
        } catch {
          // Se o /me der 401, prossegue para renovar via cookie refreshToken
        }

        // 2. Tenta o refresh da sessão usando o cookie HttpOnly
        const json = await apiFetch('/auth/refresh', {
          method: 'POST',
          body: {},
          skipRetry: true,
        });

        const token = json?.data?.accessToken;
        if (token) {
          setAccessToken(token);
        }

        // Busca os dados atualizados do usuário pós-refresh
        const me = await fetchMe();
        if (isMounted && me) {
          setUser(me);
          localStorage.setItem('@App:user', JSON.stringify(me));
        }
      } catch {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('@App:user');
          localStorage.removeItem('@App:token');
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiSignin(credentials);
    setUser(data.user);
    localStorage.setItem('@App:user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiSignout();
    } catch (err) {
      console.error('Erro ao fazer signout na API', err);
    } finally {
      setUser(null);
      localStorage.removeItem('@App:user');
      localStorage.removeItem('@App:token');
      setAccessToken(null);
      toast.info('Sessão encerrada com sucesso.');
    }
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
