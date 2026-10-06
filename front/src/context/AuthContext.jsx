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

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const storedToken = localStorage.getItem('@App:token');
        if (storedToken) {
          setAccessToken(storedToken);
        }

        try {
          const me = await fetchMe();
          if (isMounted && me) {
            setUser(me);
            localStorage.setItem('@App:user', JSON.stringify(me));
            return;
          }
        } catch {
          // Token ausente ou expirado (401); prossegue normalmente para tentar o refresh
        }

        const json = await apiFetch('/auth/refresh', {
          method: 'POST',
          body: {},
          skipRetry: true,
        });

        const token = json?.data?.accessToken;
        if (token) {
          setAccessToken(token);
          localStorage.setItem('@App:token', token);
        }

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

    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      localStorage.setItem('@App:token', data.accessToken);
    }

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
