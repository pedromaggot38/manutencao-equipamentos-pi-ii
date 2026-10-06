import { api, apiFetch, setAccessToken } from './client';

export async function signin({ username, password }) {
  const json = await apiFetch('/auth/signin', {
    method: 'POST',
    body: { username, password },
    skipRetry: true,
  });

  const token = json?.data?.accessToken;
  const user = json?.data?.user;

  setAccessToken(token);

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
