// URL base da API. Em dev, o Vite expõe variáveis prefixadas com VITE_.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

let refreshingPromise = null;

export function setAccessToken(_token) {}
export function getAccessToken() {
  return null;
}

async function refreshAccessToken() {
  if (!refreshingPromise) {
    refreshingPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('refresh-failed');
        return res.json();
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

/**
 * Wrapper de fetch com:
 * - credentials: 'include'
 * - Remoção segura de Content-Type se for DELETE ou body vazio (evita erro do Fastify)
 * - retry automático 1x em caso de 401
 * - Disparo do evento 'session-expired' se o refresh falhar
 */
export async function apiFetch(
  path,
  { method = 'GET', body, headers = {}, skipRetry = false } = {},
) {
  const reqHeaders = { ...headers };

  // Só anexa Content-Type se houver corpo a ser enviado
  if (body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json';
  } else if (
    method.toUpperCase() === 'DELETE' ||
    method.toUpperCase() === 'GET'
  ) {
    delete reqHeaders['Content-Type'];
  }

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && !skipRetry) {
    try {
      await refreshAccessToken();
      res = await doFetch();
    } catch {
      // Refresh falhou: sessão realmente encerrou
      window.dispatchEvent(
        new CustomEvent('session-expired', {
          detail: 'Sua sessão expirou. Por favor, entre novamente.',
        }),
      );
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const error = new Error(data?.message || `Erro ${res.status}`);
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    apiFetch(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) =>
    apiFetch(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
};
