import { api, apiFetch, setAccessToken } from './client';

export async function signin({ username, password }) {
  // Ajuste a rota se no seu backend for /auth/signin ou apenas /signin
  const json = await apiFetch('/auth/signin', {
    method: 'POST',
    body: { username, password },
    skipRetry: true,
  });

  // Corrige a leitura do retorno do seu backend
  const token = json?.data?.accessToken;
  const user = json?.data?.user;

  // Atualiza o token na variável e no localStorage (via setAccessToken do client.js)
  setAccessToken(token);

  // Salva o usuário no localStorage para sobreviver ao F5
  if (user) {
    localStorage.setItem('@App:user', JSON.stringify(user));
  }

  return json.data;
}

export async function signout() {
  return apiFetch('/auth/signout', {
    method: 'POST',
    body: {},
    skipRetry: true,
  });
}

export async function fetchMe() {
  const json = await api.get('/me');
  return json.data.user;
}

export async function checkSetup() {
  const json = await apiFetch('/auth/setup', {
    method: 'GET',
    skipRetry: true,
  });
  return json.data.initialized;
}
